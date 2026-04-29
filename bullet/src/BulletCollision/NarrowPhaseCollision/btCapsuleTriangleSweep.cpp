#include "btCapsuleTriangleSweep.h"
#include "BulletCollision/CollisionShapes/btCapsuleShape.h"

namespace
{

// Closest point on segment [A, B] to point P. Writes barycentric t in [0,1]
// such that closest = A + (B-A)*t.
SIMD_FORCE_INLINE btVector3 closestPointOnSegment(
	const btVector3& A, const btVector3& B, const btVector3& P, btScalar& outT)
{
	btVector3 d = B - A;
	btScalar lenSq = d.dot(d);
	if (lenSq <= SIMD_EPSILON)
	{
		outT = btScalar(0);
		return A;
	}
	btScalar t = (P - A).dot(d) / lenSq;
	if (t < btScalar(0)) t = btScalar(0);
	else if (t > btScalar(1)) t = btScalar(1);
	outT = t;
	return A + d * t;
}

// Closest points on two segments [P0,P1] and [Q0,Q1].
// Real-Time Collision Detection (Ericson) §5.1.9.
SIMD_FORCE_INLINE void closestPointsSegmentSegment(
	const btVector3& P0, const btVector3& P1,
	const btVector3& Q0, const btVector3& Q1,
	btVector3& outP, btVector3& outQ)
{
	btVector3 d1 = P1 - P0;
	btVector3 d2 = Q1 - Q0;
	btVector3 r = P0 - Q0;
	btScalar a = d1.dot(d1);
	btScalar e = d2.dot(d2);
	btScalar f = d2.dot(r);

	btScalar s, t;
	const btScalar EPS = SIMD_EPSILON;

	if (a <= EPS && e <= EPS)
	{
		s = t = btScalar(0);
	}
	else if (a <= EPS)
	{
		s = btScalar(0);
		t = f / e;
		if (t < btScalar(0)) t = btScalar(0); else if (t > btScalar(1)) t = btScalar(1);
	}
	else
	{
		btScalar c = d1.dot(r);
		if (e <= EPS)
		{
			t = btScalar(0);
			s = -c / a;
			if (s < btScalar(0)) s = btScalar(0); else if (s > btScalar(1)) s = btScalar(1);
		}
		else
		{
			btScalar b = d1.dot(d2);
			btScalar denom = a * e - b * b;
			if (denom != btScalar(0))
			{
				s = (b * f - c * e) / denom;
				if (s < btScalar(0)) s = btScalar(0); else if (s > btScalar(1)) s = btScalar(1);
			}
			else
			{
				s = btScalar(0);
			}
			t = (b * s + f) / e;
			if (t < btScalar(0))
			{
				t = btScalar(0);
				s = -c / a;
				if (s < btScalar(0)) s = btScalar(0); else if (s > btScalar(1)) s = btScalar(1);
			}
			else if (t > btScalar(1))
			{
				t = btScalar(1);
				s = (b - c) / a;
				if (s < btScalar(0)) s = btScalar(0); else if (s > btScalar(1)) s = btScalar(1);
			}
		}
	}

	outP = P0 + d1 * s;
	outQ = Q0 + d2 * t;
}

// Closest point on triangle (A, B, C) to point P, via Voronoi region method.
// Real-Time Collision Detection (Ericson) §5.1.5.
//
// For the face-interior branch we project P onto the triangle plane along
// (B-A)×(C-A) instead of reconstructing via barycentric weights. This avoids
// the cancellation noise that barycentric reconstruction picks up on huge
// triangles, keeping the contact normal clean for flat floors.
SIMD_FORCE_INLINE btVector3 closestPointOnTriangle(
	const btVector3& P,
	const btVector3& A, const btVector3& B, const btVector3& C)
{
	btVector3 ab = B - A;
	btVector3 ac = C - A;
	btVector3 ap = P - A;
	btScalar d1 = ab.dot(ap);
	btScalar d2 = ac.dot(ap);
	if (d1 <= btScalar(0) && d2 <= btScalar(0)) return A;

	btVector3 bp = P - B;
	btScalar d3 = ab.dot(bp);
	btScalar d4 = ac.dot(bp);
	if (d3 >= btScalar(0) && d4 <= d3) return B;

	btScalar vc = d1 * d4 - d3 * d2;
	if (vc <= btScalar(0) && d1 >= btScalar(0) && d3 <= btScalar(0))
	{
		btScalar denom = d1 - d3;
		btScalar v = (denom > SIMD_EPSILON) ? (d1 / denom) : btScalar(0);
		return A + ab * v;
	}

	btVector3 cp = P - C;
	btScalar d5 = ab.dot(cp);
	btScalar d6 = ac.dot(cp);
	if (d6 >= btScalar(0) && d5 <= d6) return C;

	btScalar vb = d5 * d2 - d1 * d6;
	if (vb <= btScalar(0) && d2 >= btScalar(0) && d6 <= btScalar(0))
	{
		btScalar denom = d2 - d6;
		btScalar w = (denom > SIMD_EPSILON) ? (d2 / denom) : btScalar(0);
		return A + ac * w;
	}

	btScalar va = d3 * d6 - d5 * d4;
	btScalar bcDenom = (d4 - d3) + (d5 - d6);
	if (va <= btScalar(0) && (d4 - d3) >= btScalar(0) && (d5 - d6) >= btScalar(0))
	{
		btScalar w = (bcDenom > SIMD_EPSILON) ? ((d4 - d3) / bcDenom) : btScalar(0);
		return B + (C - B) * w;
	}

	// Face interior: project P along the triangle normal onto the plane.
	btVector3 normal = ab.cross(ac);
	btScalar nLen2 = normal.dot(normal);
	if (nLen2 > SIMD_EPSILON)
	{
		btScalar h = ap.dot(normal) / nLen2;
		return P - normal * h;
	}
	// Degenerate (zero-area) triangle: fall back to vertex A.
	return A;
}

// Closest points between segment [P, Q] and triangle (A, B, C).
// Returns squared distance and writes closest pair.
// If the segment crosses the triangle interior, returns 0 with both points
// at the crossing.
SIMD_FORCE_INLINE btScalar closestPointsSegmentTriangleSquared(
	const btVector3& P, const btVector3& Q,
	const btVector3& A, const btVector3& B, const btVector3& C,
	btVector3& outSeg, btVector3& outTri)
{
	btVector3 ab = B - A;
	btVector3 ac = C - A;
	btVector3 normal = ab.cross(ac);
	btScalar nLen2 = normal.dot(normal);

	// Detect the segment piercing the triangle interior — closest distance is 0.
	if (nLen2 > SIMD_EPSILON)
	{
		btVector3 d = Q - P;
		btScalar denom = normal.dot(d);
		if (btFabs(denom) > SIMD_EPSILON)
		{
			btScalar hP = normal.dot(P - A);
			btScalar t = -hP / denom;
			if (t >= btScalar(0) && t <= btScalar(1))
			{
				btVector3 X = P + d * t;
				// Barycentric inside-test
				btVector3 ax = X - A;
				btScalar dot00 = ac.dot(ac);
				btScalar dot01 = ac.dot(ab);
				btScalar dot02 = ac.dot(ax);
				btScalar dot11 = ab.dot(ab);
				btScalar dot12 = ab.dot(ax);
				btScalar invDen = (dot00 * dot11 - dot01 * dot01);
				if (btFabs(invDen) > SIMD_EPSILON)
				{
					btScalar inv = btScalar(1) / invDen;
					btScalar u = (dot11 * dot02 - dot01 * dot12) * inv;
					btScalar v = (dot00 * dot12 - dot01 * dot02) * inv;
					if (u >= btScalar(0) && v >= btScalar(0) && (u + v) <= btScalar(1))
					{
						outSeg = X;
						outTri = X;
						return btScalar(0);
					}
				}
			}
		}
	}

	btScalar best = SIMD_INFINITY;
	btVector3 bestSeg(0, 0, 0), bestTri(0, 0, 0);

	// Endpoint P vs triangle face/edges/vertices
	{
		btVector3 cp = closestPointOnTriangle(P, A, B, C);
		btScalar d2 = (P - cp).length2();
		if (d2 < best) { best = d2; bestSeg = P; bestTri = cp; }
	}
	// Endpoint Q vs triangle
	{
		btVector3 cp = closestPointOnTriangle(Q, A, B, C);
		btScalar d2 = (Q - cp).length2();
		if (d2 < best) { best = d2; bestSeg = Q; bestTri = cp; }
	}
	// Segment PQ vs each triangle edge
	{
		btVector3 cs, ct;
		closestPointsSegmentSegment(P, Q, A, B, cs, ct);
		btScalar d2 = (cs - ct).length2();
		if (d2 < best) { best = d2; bestSeg = cs; bestTri = ct; }
	}
	{
		btVector3 cs, ct;
		closestPointsSegmentSegment(P, Q, B, C, cs, ct);
		btScalar d2 = (cs - ct).length2();
		if (d2 < best) { best = d2; bestSeg = cs; bestTri = ct; }
	}
	{
		btVector3 cs, ct;
		closestPointsSegmentSegment(P, Q, C, A, cs, ct);
		btScalar d2 = (cs - ct).length2();
		if (d2 < best) { best = d2; bestSeg = cs; bestTri = ct; }
	}

	outSeg = bestSeg;
	outTri = bestTri;
	return best;
}

// Get the inner-segment endpoints of the capsule in local coordinates.
// Inner segment is the line between the two cap-sphere centres.
SIMD_FORCE_INLINE void capsuleLocalInnerSegment(
	const btCapsuleShape* caps, btVector3& outA, btVector3& outB)
{
	int axis = caps->getUpAxis();
	btScalar hh = caps->getHalfHeight();
	outA.setValue(0, 0, 0); outA[axis] = -hh;
	outB.setValue(0, 0, 0); outB[axis] = +hh;
}

}  // namespace

bool btCapsuleTriangleSweepTOI(
	const btCapsuleShape* capsule,
	const btTransform& from,
	const btTransform& to,
	const btVector3& triA,
	const btVector3& triB,
	const btVector3& triC,
	btScalar triangleMargin,
	btScalar allowedPenetration,
	btScalar maxFraction,
	btCapsuleTriangleSweepResult& outResult)
{
	const btScalar capsuleRadius = capsule->getRadius();
	const btScalar effectiveRadius = capsuleRadius + triangleMargin;
	const btScalar GAP_TOL = btScalar(0.0001);
	const int MAX_ITER = 32;

	// Inner-segment endpoints in capsule local space.
	btVector3 localA, localB;
	capsuleLocalInnerSegment(capsule, localA, localB);

	// Endpoints transformed by the (shared) basis once. Origin is added per-frame.
	const btMatrix3x3& basis = from.getBasis();
	const btVector3 originFrom = from.getOrigin();
	const btVector3 originTo = to.getOrigin();
	const btVector3 vel = originTo - originFrom;

	const btVector3 segA0 = basis * localA;
	const btVector3 segB0 = basis * localB;

	// Initialise output so callers can read it even when we report no hit.
	outResult.m_fraction = btScalar(1);
	outResult.m_hitPointWorld.setValue(0, 0, 0);
	outResult.m_normalWorld.setValue(0, 0, 0);

	btScalar t = btScalar(0);
	btVector3 lastNormal(0, 1, 0);

	for (int iter = 0; iter < MAX_ITER; ++iter)
	{
		const btVector3 origin = originFrom + vel * t;
		const btVector3 segA = segA0 + origin;
		const btVector3 segB = segB0 + origin;

		btVector3 cps, cpt;
		btScalar dist2 = closestPointsSegmentTriangleSquared(
			segA, segB, triA, triB, triC, cps, cpt);
		btScalar dist = btSqrt(dist2);

		// Effective gap (negative = penetrating beyond margin).
		btScalar gap = dist - effectiveRadius + allowedPenetration;

		btVector3 sep = cps - cpt;
		btScalar sepLen = sep.length();
		btVector3 normal;
		if (sepLen > btScalar(1e-6))
		{
			normal = sep / sepLen;
		}
		else
		{
			// Capsule axis crosses triangle face: derive normal from triangle.
			btVector3 triNormal = (triB - triA).cross(triC - triA);
			btScalar tnLen = triNormal.length();
			if (tnLen > SIMD_EPSILON)
			{
				normal = triNormal / tnLen;
				// Choose orientation so we report the side the capsule came from.
				if (vel.dot(normal) > btScalar(0)) normal = -normal;
			}
			else
			{
				normal = lastNormal;
			}
		}
		lastNormal = normal;

		if (gap <= GAP_TOL)
		{
			if (t > maxFraction) return false;
			outResult.m_fraction = t < btScalar(0) ? btScalar(0) : t;
			outResult.m_normalWorld = normal;
			outResult.m_hitPointWorld = cpt;
			return true;
		}

		btScalar approach = -vel.dot(normal);
		if (approach <= SIMD_EPSILON)
		{
			// Not approaching the contact normal — no hit can occur.
			return false;
		}

		btScalar dt = gap / approach;
		// Conservative advancement should always advance forward in time.
		if (dt <= btScalar(0))
		{
			return false;
		}

		t += dt;
		if (t > maxFraction)
		{
			return false;
		}
	}

	// Did not converge within MAX_ITER. Drop the hit rather than risk a false
	// positive; the next sub-step will retry from a slightly different state.
	return false;
}

bool btCapsuleTriangleContactDiscrete(
	const btCapsuleShape* capsule,
	const btTransform& capsuleWorldTransform,
	const btVector3& triA,
	const btVector3& triB,
	const btVector3& triC,
	btScalar contactBreakingThreshold,
	btCapsuleTriangleContact& outContact)
{
	const btScalar radius = capsule->getRadius();
	const btScalar radiusWithThreshold = radius + contactBreakingThreshold;

	// Inner-segment endpoints in capsule local space, then transformed to world.
	btVector3 localA, localB;
	capsuleLocalInnerSegment(capsule, localA, localB);
	const btVector3 segA = capsuleWorldTransform * localA;
	const btVector3 segB = capsuleWorldTransform * localB;

	btVector3 cps, cpt;
	const btScalar dist2 = closestPointsSegmentTriangleSquared(
		segA, segB, triA, triB, triC, cps, cpt);

	// Cull contacts farther than radius + threshold.
	if (dist2 >= radiusWithThreshold * radiusWithThreshold)
	{
		return false;
	}

	const btVector3 sep = cps - cpt;
	const btScalar dist = btSqrt(dist2);

	btVector3 normal;
	btScalar depth;

	if (dist > btScalar(1e-6))
	{
		normal = sep / dist;
		depth = dist - radius;
		outContact.m_pointOnBWorld = cpt;
	}
	else
	{
		// Capsule inner-segment crosses (or grazes) the triangle face.
		// Use the face normal, oriented toward whichever side of the plane the
		// segment midpoint lies on. That gives a stable push direction even
		// when sep ≈ 0, and matches what EPA would converge to in pure
		// arithmetic.
		btVector3 faceN = (triB - triA).cross(triC - triA);
		const btScalar fnLen = faceN.length();
		if (fnLen <= SIMD_EPSILON)
		{
			return false;  // degenerate triangle, nothing meaningful to report
		}
		faceN /= fnLen;

		const btVector3 segMid = (segA + segB) * btScalar(0.5);
		if ((segMid - triA).dot(faceN) < btScalar(0))
		{
			faceN = -faceN;
		}

		// Distance of each segment endpoint past the triangle plane along the
		// chosen normal. The "deeper" endpoint (smallest projection) drives
		// the penetration depth — the deepest point of either hemisphere lies
		// at (endpoint - radius * normal) in the chosen direction.
		const btScalar dA = (segA - triA).dot(faceN);
		const btScalar dB = (segB - triA).dot(faceN);
		const btScalar minD = (dA < dB) ? dA : dB;

		normal = faceN;
		depth = minD - radius;
		outContact.m_pointOnBWorld = cpt;
	}

	outContact.m_normalOnBWorld = normal;
	outContact.m_depth = depth;
	return true;
}
