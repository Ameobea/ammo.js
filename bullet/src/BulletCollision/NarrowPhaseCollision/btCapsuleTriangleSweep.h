/*
Closed-form swept-capsule-vs-triangle time-of-impact for the
btCollisionWorld::convexSweepTest path, plus a discrete capsule-vs-triangle
contact function for the btConvexConcaveCollisionAlgorithm path. Both replace
GJK / EPA for capsule shapes to avoid f32 precision loss on large triangles.

See FINDINGS.md in /tmp/bullet_repro/ for the analysis that motivated this.
*/

#ifndef BT_CAPSULE_TRIANGLE_SWEEP_H
#define BT_CAPSULE_TRIANGLE_SWEEP_H

#include "LinearMath/btVector3.h"
#include "LinearMath/btTransform.h"

class btCapsuleShape;

struct btCapsuleTriangleSweepResult
{
	btScalar m_fraction;       // time of impact in [0, 1]
	btVector3 m_hitPointWorld; // contact point in world space, on the triangle side
	btVector3 m_normalWorld;   // contact normal, pointing from triangle toward capsule
};

/// Discrete contact between a capsule and a triangle. Mirrors the convention
/// used by btManifoldResult::addContactPoint: normalOnB points from the
/// triangle toward the capsule, pointOnB is the contact point on the triangle
/// in world space, depth is the signed gap (negative = penetrating).
struct btCapsuleTriangleContact
{
	btVector3 m_normalOnBWorld;
	btVector3 m_pointOnBWorld;
	btScalar m_depth;
};

/// Compute the time of impact between a translating capsule and a static triangle,
/// in world space. Returns true if a hit occurs at fraction <= maxFraction.
///
/// `capsule` defines radius, halfHeight and upAxis. `from` and `to` are the
/// world transforms of the capsule at fraction 0 and 1 respectively. Only their
/// translational difference is used; the basis must be the same in both
/// (caller is expected to handle rotation by falling back to GJK).
///
/// `triA/B/C` are the triangle vertices in world space.
/// `triangleMargin` is the contact margin to add to the triangle (matches
/// Bullet's btTriangleShape::setMargin behaviour).
/// `allowedPenetration` matches Bullet's m_allowedPenetration semantics:
/// the loop tolerates penetration up to that depth before reporting a hit.
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
	btCapsuleTriangleSweepResult& outResult);

/// Compute discrete contact between a capsule (at `capsuleWorldTransform`)
/// and a triangle whose vertices are given in world space. Returns true if
/// the gap between capsule and triangle is at most `contactBreakingThreshold`,
/// meaning the manifold should keep this contact. `outContact` is populated
/// with manifold-ready normal / point / depth.
///
/// The triangle is treated as a single-sided plane segment; the normal is
/// auto-oriented toward the capsule so callers don't need to track winding.
/// The contact is exact for non-pierce cases (closest pair of segment vs
/// triangle); when the capsule axis pierces the triangle face, depth is
/// computed from how far the deepest segment endpoint is past the plane,
/// plus the radius.
bool btCapsuleTriangleContactDiscrete(
	const btCapsuleShape* capsule,
	const btTransform& capsuleWorldTransform,
	const btVector3& triA,
	const btVector3& triB,
	const btVector3& triC,
	btScalar contactBreakingThreshold,
	btCapsuleTriangleContact& outContact);

#endif // BT_CAPSULE_TRIANGLE_SWEEP_H
