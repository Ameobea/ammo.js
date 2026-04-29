/*
Bullet Continuous Collision Detection and Physics Library
Copyright (c) 2003-2008 Erwin Coumans  http://bulletphysics.com

Modified extensively by Casey Primozic

This software is provided 'as-is', without any express or implied warranty.
In no event will the authors be held liable for any damages arising from the use of this software.
Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it freely,
subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim that you wrote the original software. If
you use this software in a product, an acknowledgment in the product documentation would be appreciated but is not
required.
2. Altered source versions must be plainly marked as such, and must not be misrepresented as being the original
software.
3. This notice may not be removed or altered from any source distribution.
*/

#include "btKinematicCharacterController.h"
#include <cstdlib>
#include "btJumpPad.h"
#include "btBoostZone.h"
#include "btDashToken.h"
#include "BulletCollision/BroadphaseCollision/btCollisionAlgorithm.h"
#include "BulletCollision/BroadphaseCollision/btOverlappingPairCache.h"
#include "BulletCollision/CollisionDispatch/btCollisionWorld.h"
#include "BulletDynamics/Dynamics/btDiscreteDynamicsWorld.h"
#include "BulletCollision/CollisionDispatch/btGhostObject.h"
#include "BulletCollision/CollisionShapes/btMultiSphereShape.h"
#include "BulletCollision/CollisionShapes/btBvhTriangleMeshShape.h"
#include "BulletCollision/CollisionShapes/btScaledBvhTriangleMeshShape.h"
#include "BulletCollision/CollisionShapes/btTriangleShape.h"
#include "BulletCollision/CollisionShapes/btCapsuleShape.h"
#include "BulletCollision/NarrowPhaseCollision/btRaycastCallback.h"
#include "BulletCollision/CollisionDispatch/btInternalEdgeUtility.h"
#include "BulletCollision/CollisionDispatch/btCollisionObjectWrapper.h"
#include "LinearMath/btDefaultMotionState.h"
#include "LinearMath/btIDebugDraw.h"
#include <cstring>

static btVector3 getNormalizedVector(const btVector3& v) {
  btVector3 n(0, 0, 0);

  if (v.length() > SIMD_EPSILON) {
    n = v.normalized();
  }
  return n;
}

#define MAX_PENETRATION_LOOPS 16

// if set to 1, then 1/MAX_PENETRATION_LOOPS of the penetration depth will be recovered per iteration
//
// setting to higher values may reduce or prevent some cases where penetration cannot be recovered from
#define PENETRATION_RECOVERY_PER_ITER 5.

#define KCC_LOG_RECOVERY_FAIL 0
#define KCC_LOG_GROUND_STATE 0

// Master flag for the v1 stepDown 4-fix stack (see STEPDOWN_FLICKER.md):
//   - Fix 1: useCb2 path in floorBlk when runOnce && cb1 missed but cb2 hit
//   - Fix 2: cap cumulative vertical recovery at stepHeight - 0.001
//   - Fix 3: extend runOnce when wasOG && both sweeps miss
//   - Fix 4: tighten floorBlk gate to require an actual hit (not just runOnce)
// Set to 0 to revert all four to pre-fix behavior for bisecting regressions.
#define KCC_STEPDOWN_FIXES 1

#if KCC_LOG_GROUND_STATE
  #define KCC_GLOG(...) do { printf("[ground] " __VA_ARGS__); } while (0)
#else
  #define KCC_GLOG(...) ((void)0)
#endif

static bool btBuildInternalEdgeTriangleShape(
  const btCollisionObject* collisionObject,
  int partId,
  int triangleIndex,
  btTriangleShape& triangleShape
) {
  if (!collisionObject || partId < 0 || triangleIndex < 0) {
    return false;
  }

  const btCollisionShape* collisionShape = collisionObject->getCollisionShape();
  if (!collisionShape) {
    return false;
  }

  const btBvhTriangleMeshShape* trimesh = 0;
  btVector3 shapeScaling(1, 1, 1);

  switch (collisionShape->getShapeType()) {
    case TRIANGLE_MESH_SHAPE_PROXYTYPE:
      trimesh = static_cast<const btBvhTriangleMeshShape*>(collisionShape);
      break;
    case SCALED_TRIANGLE_MESH_SHAPE_PROXYTYPE: {
      const btScaledBvhTriangleMeshShape* scaledShape =
        static_cast<const btScaledBvhTriangleMeshShape*>(collisionShape);
      trimesh = scaledShape->getChildShape();
      shapeScaling = scaledShape->getLocalScaling();
      break;
    }
    default:
      return false;
  }

  if (!trimesh) {
    return false;
  }

  const btStridingMeshInterface* meshInterface = trimesh->getMeshInterface();
  if (!meshInterface || partId >= meshInterface->getNumSubParts()) {
    return false;
  }

  const unsigned char* vertexbase = 0;
  int numverts = 0;
  PHY_ScalarType type = PHY_INTEGER;
  int stride = 0;
  const unsigned char* indexbase = 0;
  int indexstride = 0;
  int numfaces = 0;
  PHY_ScalarType indicestype = PHY_INTEGER;

  meshInterface->getLockedReadOnlyVertexIndexBase(
    &vertexbase,
    numverts,
    type,
    stride,
    &indexbase,
    indexstride,
    numfaces,
    indicestype,
    partId
  );

  if (triangleIndex >= numfaces) {
    meshInterface->unLockReadOnlyVertexBase(partId);
    return false;
  }

  unsigned int* gfxbase = (unsigned int*)(indexbase + triangleIndex * indexstride);
  btAssert(indicestype == PHY_INTEGER || indicestype == PHY_SHORT || indicestype == PHY_UCHAR);

  const btVector3& meshScaling = meshInterface->getScaling();
  const btVector3 totalScaling(
    meshScaling.getX() * shapeScaling.getX(),
    meshScaling.getY() * shapeScaling.getY(),
    meshScaling.getZ() * shapeScaling.getZ()
  );

  for (int j = 2; j >= 0; --j) {
    const int graphicsindex =
      indicestype == PHY_SHORT
        ? ((unsigned short*)gfxbase)[j]
        : indicestype == PHY_INTEGER ? gfxbase[j] : ((unsigned char*)gfxbase)[j];

    if (type == PHY_FLOAT) {
      const float* graphicsbase = (const float*)(vertexbase + graphicsindex * stride);
      triangleShape.getVertexPtr(j).setValue(
        graphicsbase[0] * totalScaling.getX(),
        graphicsbase[1] * totalScaling.getY(),
        graphicsbase[2] * totalScaling.getZ()
      );
    } else {
      const double* graphicsbase = (const double*)(vertexbase + graphicsindex * stride);
      triangleShape.getVertexPtr(j).setValue(
        btScalar(graphicsbase[0]) * totalScaling.getX(),
        btScalar(graphicsbase[1]) * totalScaling.getY(),
        btScalar(graphicsbase[2]) * totalScaling.getZ()
      );
    }
  }

  meshInterface->unLockReadOnlyVertexBase(partId);
  triangleShape.setMargin(collisionShape->getMargin());
  return true;
}

class btKinematicClosestNotMeRayResultCallback : public btCollisionWorld::ClosestRayResultCallback {
public:
  btKinematicClosestNotMeRayResultCallback(btCollisionObject* me)
    : btCollisionWorld::ClosestRayResultCallback(btVector3(0.0, 0.0, 0.0), btVector3(0.0, 0.0, 0.0)) {
    m_me = me;
  }

  virtual btScalar addSingleResult(btCollisionWorld::LocalRayResult& rayResult, bool normalInWorldSpace) {
    if (rayResult.m_collisionObject == m_me) {
      return 1.0;
    }

    return ClosestRayResultCallback::addSingleResult(rayResult, normalInWorldSpace);
  }

protected:
  btCollisionObject* m_me;
};

class btKinematicClosestNotMeConvexResultCallback : public btCollisionWorld::ClosestConvexResultCallback {
public:
  btKinematicClosestNotMeConvexResultCallback(btCollisionObject* me, const btVector3& up, btScalar minSlopeDot)
    : btCollisionWorld::ClosestConvexResultCallback(btVector3(0.0, 0.0, 0.0), btVector3(0.0, 0.0, 0.0))
    , m_me(me)
    , m_up(up)
    , m_minSlopeDot(minSlopeDot) {}

  virtual btScalar addSingleResult(btCollisionWorld::LocalConvexResult& convexResult, bool normalInWorldSpace) {
    if (convexResult.m_hitCollisionObject == m_me || !convexResult.m_hitCollisionObject->hasContactResponse()) {
      return 1.;
    }

    btVector3 hitNormalWorld;
    if (normalInWorldSpace) {
      hitNormalWorld = convexResult.m_hitNormalLocal;
    } else {
      hitNormalWorld = convexResult.m_hitCollisionObject->getWorldTransform().getBasis() * convexResult.m_hitNormalLocal;
    }

    if (convexResult.m_localShapeInfo) {
      btCollisionObjectWrapper obj0Wrap(0, convexResult.m_hitCollisionObject->getCollisionShape(), convexResult.m_hitCollisionObject, convexResult.m_hitCollisionObject->getWorldTransform(), -1, -1);
      btCollisionObjectWrapper obj1Wrap(0, m_me->getCollisionShape(), m_me, m_me->getWorldTransform(), -1, -1);

      btTriangleShape triShape;
      if (btBuildInternalEdgeTriangleShape(
            convexResult.m_hitCollisionObject,
            convexResult.m_localShapeInfo->m_shapePart,
            convexResult.m_localShapeInfo->m_triangleIndex,
            triShape
          )) {
        btCollisionObjectWrapper triObj0Wrap(
          &obj0Wrap,
          &triShape,
          convexResult.m_hitCollisionObject,
          convexResult.m_hitCollisionObject->getWorldTransform(),
          convexResult.m_localShapeInfo->m_shapePart,
          convexResult.m_localShapeInfo->m_triangleIndex
        );

        btManifoldPoint dummyPt;
        dummyPt.m_normalWorldOnB = hitNormalWorld;
        dummyPt.m_localPointB = convexResult.m_hitCollisionObject->getWorldTransform().invXform(convexResult.m_hitPointLocal);

        btAdjustInternalEdgeContacts(
          dummyPt,
          &triObj0Wrap,
          &obj1Wrap,
          convexResult.m_localShapeInfo->m_shapePart,
          convexResult.m_localShapeInfo->m_triangleIndex
        );
        hitNormalWorld = dummyPt.m_normalWorldOnB;
      }
    }

    btScalar dotUp = m_up.dot(hitNormalWorld);
    if (dotUp < m_minSlopeDot) {
      return 1.0;
    }

    // Update the result with the (possibly adjusted) normal
    btScalar fraction = ClosestConvexResultCallback::addSingleResult(convexResult, normalInWorldSpace);
    m_hitNormalWorld = hitNormalWorld;

    return fraction;
  }

protected:
  btCollisionObject* m_me;
  const btVector3 m_up;
  btScalar m_minSlopeDot;
};

/*
 * Returns the reflection direction of a ray going 'direction' hitting a surface with normal 'normal'
 *
 * from: http://www-cs-students.stanford.edu/~adityagp/final/node3.html
 */
btVector3 btKinematicCharacterController::computeReflectionDirection(const btVector3& direction, const btVector3& normal) {
  return direction - (btScalar(2.0) * direction.dot(normal)) * normal;
}

btVector3 btKinematicCharacterController::parallelComponent(const btVector3& direction, const btVector3& normal) {
  btScalar magnitude = direction.dot(normal);
  return normal * magnitude;
}

btVector3 btKinematicCharacterController::perpindicularComponent(const btVector3& direction, const btVector3& normal) {
  return direction - parallelComponent(direction, normal);
}

btKinematicCharacterController::btKinematicCharacterController(
  btPairCachingGhostObject* ghostObject,
  btConvexShape* convexShape,
  btScalar stepHeight,
  const btVector3& up
) {
  m_ghostObject = ghostObject;
  m_up.setValue(0.0f, 0.0f, 1.0f);
  m_jumpAxis.setValue(0.0f, 0.0f, 1.0f);
  m_addedMargin = 0.02;
  m_walkDirection.setValue(0.0, 0.0, 0.0);
  m_convexShape = convexShape;
  m_verticalVelocity = 0.0;
  m_gravity = 9.8 * 3.0;
  m_terminalVelocity = 55.0;
  m_defaultJumpSpeed = 10.0;
  m_wasOnGround = false;
  m_onGround = false;
  m_isJumping = false;
  m_currentStepOffset = 0.0;
  m_maxPenetrationDepth = 0.2;
  m_externalVelocityAirDampingFactor = btVector3(0.82, 0.75, 0.82);
  m_externalVelocityGroundDampingFactor = btVector3(0.9992, 0.9992, 0.9992);

  setUp(up);
  setStepHeight(stepHeight);
  setMaxSlope(btRadians(45.0));
}

// Here we must refresh the overlapping paircache as the penetrating movement itself or the
// previous recovery iteration might have used setWorldTransform and pushed us into an object
// that is not in the previous cache contents from the last timestep, as will happen if we
// are pushed into a new AABB overlap. Unhandled this means the next convex sweep gets stuck.
//
// Do this by calling the broadphase's setAabb with the moved AABB, this will update the broadphase
// paircache and the ghostobject's internal paircache at the same time.    /BW
bool btKinematicCharacterController::recoverFromPenetration(btCollisionWorld* collisionWorld) {
  btVector3 minAabb, maxAabb;
  m_convexShape->getAabb(m_ghostObject->getWorldTransform(), minAabb, maxAabb);
  collisionWorld->getBroadphase()->setAabb(
    m_ghostObject->getBroadphaseHandle(), minAabb, maxAabb, collisionWorld->getDispatcher()
  );

  bool penetration = false;

  collisionWorld->getDispatcher()->dispatchAllCollisionPairs(
    m_ghostObject->getOverlappingPairCache(), collisionWorld->getDispatchInfo(), collisionWorld->getDispatcher()
  );

  m_currentPosition = m_ghostObject->getWorldTransform().getOrigin();

  for (int i = 0; i < m_ghostObject->getOverlappingPairCache()->getNumOverlappingPairs(); i++) {
    m_manifoldArray.resize(0);

    btBroadphasePair* collisionPair = &m_ghostObject->getOverlappingPairCache()->getOverlappingPairArray()[i];

    btCollisionObject* obj0 = static_cast<btCollisionObject*>(collisionPair->m_pProxy0->m_clientObject);
    btCollisionObject* obj1 = static_cast<btCollisionObject*>(collisionPair->m_pProxy1->m_clientObject);

    if ((obj0 && !obj0->hasContactResponse()) || (obj1 && !obj1->hasContactResponse()) || !needsCollision(obj0, obj1)) {
      continue;
    }

    if (collisionPair->m_algorithm) {
      collisionPair->m_algorithm->getAllContactManifolds(m_manifoldArray);
    }

    for (int j = 0; j < m_manifoldArray.size(); j++) {
      btPersistentManifold* manifold = m_manifoldArray[j];
      btScalar directionSign = manifold->getBody0() == m_ghostObject ? btScalar(-1.0) : btScalar(1.0);
      for (int p = 0; p < manifold->getNumContacts(); p++) {
        btManifoldPoint& pt = manifold->getContactPoint(p);

        if (pt.m_distance1 < 0) {
          btCollisionObjectWrapper obj0Wrap(0, manifold->getBody0()->getCollisionShape(), manifold->getBody0(), manifold->getBody0()->getWorldTransform(), -1, -1);
          btCollisionObjectWrapper obj1Wrap(0, manifold->getBody1()->getCollisionShape(), manifold->getBody1(), manifold->getBody1()->getWorldTransform(), -1, -1);

          if (manifold->getBody0() == m_ghostObject) {
            btTriangleShape triShape;
            if (btBuildInternalEdgeTriangleShape(manifold->getBody1(), pt.m_partId1, pt.m_index1, triShape)) {
              btCollisionObjectWrapper triObj1Wrap(
                &obj1Wrap,
                &triShape,
                manifold->getBody1(),
                manifold->getBody1()->getWorldTransform(),
                pt.m_partId1,
                pt.m_index1
              );
              btAdjustInternalEdgeContacts(pt, &triObj1Wrap, &obj0Wrap, pt.m_partId1, pt.m_index1);
            }
          } else {
            btTriangleShape triShape;
            if (btBuildInternalEdgeTriangleShape(manifold->getBody0(), pt.m_partId0, pt.m_index0, triShape)) {
              btCollisionObjectWrapper triObj0Wrap(
                &obj0Wrap,
                &triShape,
                manifold->getBody0(),
                manifold->getBody0()->getWorldTransform(),
                pt.m_partId0,
                pt.m_index0
              );
              btAdjustInternalEdgeContacts(pt, &triObj0Wrap, &obj1Wrap, pt.m_partId0, pt.m_index0);
            }
          }
        }

        btScalar dist = pt.getDistance();

        if (dist < -m_maxPenetrationDepth) {
          btVector3 recovery = pt.m_normalWorldOnB * directionSign * dist *
                               btScalar(1. / (btScalar(MAX_PENETRATION_LOOPS) / PENETRATION_RECOVERY_PER_ITER));

          // For walkable surfaces, only recover vertically to prevent slope sliding.
          // Without this, the recovery push along the surface normal has a horizontal
          // component that causes the player to slide on inclines and slip off edges.
          btScalar normalDotUp = (pt.m_normalWorldOnB * directionSign).dot(m_up);
          if (m_onGround && btFabs(normalDotUp) > m_maxSlopeCosine) {
            btScalar verticalAmount = recovery.dot(m_up);
            recovery = m_up * verticalAmount;
          }

          m_currentPosition += recovery;

          /* old code: unconditional push along contact normal
          m_currentPosition += pt.m_normalWorldOnB * directionSign * dist *
                               btScalar(1. / (btScalar(MAX_PENETRATION_LOOPS) / PENETRATION_RECOVERY_PER_ITER));
          */
          penetration = true;
        }
      }
    }
  }
  btTransform newTrans = m_ghostObject->getWorldTransform();
  newTrans.setOrigin(m_currentPosition);
  m_ghostObject->setWorldTransform(newTrans);
  return penetration;
}

// If the player is on the ground and the object they're standing on is non-static, then we apply motions from that
// object to the player's position to keep them standing at the same point on that object.
//
// This makes things like moving platforms work.
void btKinematicCharacterController::maybeApplyFloorLock(btCollisionWorld* collisionWorld) {
  if (!m_wasOnGround || !m_floorObject) {
    return;
  }

  // check that the floor object is still in the collision world
  btAlignedObjectArray<class btCollisionObject*>& collisionObjectsMut = collisionWorld->getCollisionObjectArray();
  // can't use `findLinearSearch` because of stupid pointer constness issues in the template
  auto collisionObjectCount = collisionObjectsMut.size();
  auto didFindFloorObject = false;
  for (int i = 0; i < collisionObjectCount; ++i) {
    if (collisionObjectsMut[i] == m_floorObject) {
      didFindFloorObject = true;
      break;
    }
  }

  if (!didFindFloorObject) {
    // floor object has been removed from the collision world
    m_floorObject = nullptr;
    m_floorUserIndex = -1;
    return;
  }

  // we can skip this work if the floor object is static
  if (m_floorObject->isStaticObject()) {
    return;
  }

  const btTransform& prevFloorTransform = m_floorObject->getPreviousWorldTransform();
  const btTransform& currFloorTransform = m_floorObject->getWorldTransform();

  const btVector3 prevOrigin = prevFloorTransform.getOrigin();
  const btVector3 currOrigin = currFloorTransform.getOrigin();
  btQuaternion prevRot = prevFloorTransform.getRotation();
  btQuaternion currRot = currFloorTransform.getRotation();

  btVector3 translationDelta = currOrigin - prevOrigin;
  btQuaternion deltaRot = currRot * prevRot.inverse();
  btScalar rotAngle = deltaRot.getAngle();

  if (translationDelta.length2() < SIMD_EPSILON && rotAngle < SIMD_EPSILON) {
    return;
  }

  // Apply the floor's delta transform to the player's position.
  m_currentPosition = currOrigin + quatRotate(deltaRot, m_currentPosition - prevOrigin);

  // sync the new position to the ghost object
  btTransform& xform = m_ghostObject->getWorldTransform();
  xform.setOrigin(m_currentPosition);
  m_ghostObject->setWorldTransform(xform);
}

// Walk the broadphase pair list and the contact manifolds and dump everything we'd
// need to reconstruct this state in a harness: world transforms, mesh extents (incl.
// triangle vertices for the offending contacts), per-contact GJK distances/normals,
// player kinematic state, input state. Single-line "[recover.fail]" prefix on each
// line so a session log can be grep'd for one fire and the surrounding lines copied.
void btKinematicCharacterController::dumpRecoveryFailureContext(
  btCollisionWorld* world, const char* phase, int numLoops
) {
  #define RFAIL(...) do { printf("[recover.fail] " __VA_ARGS__); } while (0)

  RFAIL("=== begin %s loops=%d t=%.4f ===\n", phase, numLoops, m_totalElapsedTime);

  // Player kinematic + input state.
  RFAIL("player.pos=(%.6f,%.6f,%.6f) target=(%.6f,%.6f,%.6f) vy=%.6f\n",
        m_currentPosition.x(), m_currentPosition.y(), m_currentPosition.z(),
        m_targetPosition.x(), m_targetPosition.y(), m_targetPosition.z(),
        m_verticalVelocity);
  RFAIL("player.walkDir=(%.6f,%.6f,%.6f) extVel=(%.6f,%.6f,%.6f)\n",
        m_walkDirection.x(), m_walkDirection.y(), m_walkDirection.z(),
        m_externalVelocity.x(), m_externalVelocity.y(), m_externalVelocity.z());
  RFAIL("player.up=(%.4f,%.4f,%.4f) jumpAxis=(%.4f,%.4f,%.4f) stepOff=%.6f stepHeight=%.4f\n",
        m_up.x(), m_up.y(), m_up.z(), m_jumpAxis.x(), m_jumpAxis.y(), m_jumpAxis.z(),
        m_currentStepOffset, m_stepHeight);
  RFAIL("player.flags onGround=%d wasOnGround=%d isJumping=%d\n",
        m_onGround ? 1 : 0, m_wasOnGround ? 1 : 0, m_isJumping ? 1 : 0);
  RFAIL("player.config maxPen=%.6f maxSlopeCos=%.6f gravity=%.4f terminal=%.4f\n",
        m_maxPenetrationDepth, m_maxSlopeCosine, m_gravity, m_terminalVelocity);
  RFAIL("player.input keys=%d theta=%.4f phi=%.4f movement=%d\n",
        m_inputKeyFlags, m_inputTheta, m_inputPhi, m_inputMovementEnabled ? 1 : 0);

  // Capsule shape parameters (so the harness can build an identical collider).
  if (m_convexShape) {
    int st = m_convexShape->getShapeType();
    RFAIL("player.shape type=%d margin=%.6f\n", st, m_convexShape->getMargin());
    if (st == CAPSULE_SHAPE_PROXYTYPE) {
      const btCapsuleShape* cap = static_cast<const btCapsuleShape*>(m_convexShape);
      RFAIL("player.capsule radius=%.6f halfHeight=%.6f upAxis=%d\n",
            cap->getRadius(), cap->getHalfHeight(), cap->getUpAxis());
    }
  }

  // Player ghost AABB (matches what the broadphase sees this tick).
  btVector3 minA, maxA;
  m_convexShape->getAabb(m_ghostObject->getWorldTransform(), minA, maxA);
  RFAIL("player.aabb min=(%.4f,%.4f,%.4f) max=(%.4f,%.4f,%.4f)\n",
        minA.x(), minA.y(), minA.z(), maxA.x(), maxA.y(), maxA.z());

  // All overlapping pairs the ghost is touching this tick.
  btHashedOverlappingPairCache* pairs = m_ghostObject->getOverlappingPairCache();
  int numPairs = pairs->getNumOverlappingPairs();
  RFAIL("scene.pairs=%d\n", numPairs);

  for (int i = 0; i < numPairs; ++i) {
    btBroadphasePair* pair = &pairs->getOverlappingPairArray()[i];
    btCollisionObject* a = static_cast<btCollisionObject*>(pair->m_pProxy0->m_clientObject);
    btCollisionObject* b = static_cast<btCollisionObject*>(pair->m_pProxy1->m_clientObject);
    btCollisionObject* other = (a == m_ghostObject) ? b : a;
    if (!other) {
      RFAIL("pair[%d] OTHER=null\n", i);
      continue;
    }

    const btCollisionShape* shape = other->getCollisionShape();
    const btTransform& xf = other->getWorldTransform();
    const btVector3& ori = xf.getOrigin();
    btQuaternion rot = xf.getRotation();
    btVector3 omin, omax;
    if (shape) {
      shape->getAabb(xf, omin, omax);
    } else {
      omin.setValue(0, 0, 0); omax.setValue(0, 0, 0);
    }
    int otherShapeType = shape ? shape->getShapeType() : -1;
    RFAIL("pair[%d] obj=%p name=%s shapeType=%d static=%d hasResp=%d userIdx=%d userIdx2=%d\n",
          i, (void*)other,
          shape ? shape->getName() : "(null)",
          otherShapeType,
          other->isStaticObject() ? 1 : 0,
          other->hasContactResponse() ? 1 : 0,
          other->getUserIndex(), other->getUserIndex2());
    RFAIL("pair[%d] xf.origin=(%.6f,%.6f,%.6f) xf.rot=(%.6f,%.6f,%.6f,%.6f)\n",
          i, ori.x(), ori.y(), ori.z(), rot.x(), rot.y(), rot.z(), rot.w());
    RFAIL("pair[%d] aabb min=(%.4f,%.4f,%.4f) max=(%.4f,%.4f,%.4f)\n",
          i, omin.x(), omin.y(), omin.z(), omax.x(), omax.y(), omax.z());

    // For trimesh shapes, pull the underlying mesh extents and scaling.
    const btBvhTriangleMeshShape* trimesh = nullptr;
    btVector3 extraScaling(1, 1, 1);
    if (otherShapeType == TRIANGLE_MESH_SHAPE_PROXYTYPE) {
      trimesh = static_cast<const btBvhTriangleMeshShape*>(shape);
    } else if (otherShapeType == SCALED_TRIANGLE_MESH_SHAPE_PROXYTYPE) {
      const btScaledBvhTriangleMeshShape* scaled =
        static_cast<const btScaledBvhTriangleMeshShape*>(shape);
      trimesh = scaled->getChildShape();
      extraScaling = scaled->getLocalScaling();
    }
    if (trimesh && trimesh->getMeshInterface()) {
      const btStridingMeshInterface* mi = trimesh->getMeshInterface();
      btVector3 ms = mi->getScaling();
      RFAIL("pair[%d] mesh scaling=(%.6f,%.6f,%.6f) outerScale=(%.6f,%.6f,%.6f) subParts=%d hasInfoMap=%d\n",
            i, ms.x(), ms.y(), ms.z(),
            extraScaling.x(), extraScaling.y(), extraScaling.z(),
            mi->getNumSubParts(),
            trimesh->getTriangleInfoMap() ? 1 : 0);
    }

    // Refresh manifolds for this pair and dump every contact (penetrating or not).
    m_manifoldArray.resize(0);
    if (pair->m_algorithm) {
      pair->m_algorithm->getAllContactManifolds(m_manifoldArray);
    }
    int totalContacts = 0;
    for (int j = 0; j < m_manifoldArray.size(); ++j) totalContacts += m_manifoldArray[j]->getNumContacts();
    RFAIL("pair[%d] manifolds=%d totalContacts=%d\n", i, m_manifoldArray.size(), totalContacts);

    for (int j = 0; j < m_manifoldArray.size(); ++j) {
      btPersistentManifold* m = m_manifoldArray[j];
      btScalar dirSign = (m->getBody0() == m_ghostObject) ? btScalar(-1) : btScalar(1);
      RFAIL("pair[%d] manifold[%d] body0Ghost=%d numContacts=%d\n",
            i, j, (m->getBody0() == m_ghostObject) ? 1 : 0, m->getNumContacts());

      for (int p = 0; p < m->getNumContacts(); ++p) {
        btManifoldPoint& pt = m->getContactPoint(p);
        btVector3 nW = pt.m_normalWorldOnB * dirSign;
        btScalar normalDotUp = nW.dot(m_up);
        bool wouldBeRecovered = (pt.getDistance() < -m_maxPenetrationDepth);
        bool walkable = m_onGround && btFabs(normalDotUp) > m_maxSlopeCosine;
        RFAIL("pair[%d] cp[%d] dist=%.6f distance1=%.6f appliedImpulse=%.6f\n",
              i, p, pt.getDistance(), pt.m_distance1, pt.m_appliedImpulse);
        RFAIL("pair[%d] cp[%d] nWorldOnB=(%.6f,%.6f,%.6f) nWorldFromGhost=(%.6f,%.6f,%.6f) n.up=%.4f\n",
              i, p,
              pt.m_normalWorldOnB.x(), pt.m_normalWorldOnB.y(), pt.m_normalWorldOnB.z(),
              nW.x(), nW.y(), nW.z(), normalDotUp);
        RFAIL("pair[%d] cp[%d] posA=(%.4f,%.4f,%.4f) posB=(%.4f,%.4f,%.4f)\n",
              i, p,
              pt.m_positionWorldOnA.x(), pt.m_positionWorldOnA.y(), pt.m_positionWorldOnA.z(),
              pt.m_positionWorldOnB.x(), pt.m_positionWorldOnB.y(), pt.m_positionWorldOnB.z());
        RFAIL("pair[%d] cp[%d] partId0=%d index0=%d partId1=%d index1=%d wouldRecover=%d walkableSurf=%d\n",
              i, p, pt.m_partId0, pt.m_index0, pt.m_partId1, pt.m_index1,
              wouldBeRecovered ? 1 : 0, walkable ? 1 : 0);

        // Dump triangle vertices in world space for the contact's triangle.
        // The collision tri is on the body that isn't the ghost.
        const btCollisionObject* triBody = (m->getBody0() == m_ghostObject) ? m->getBody1() : m->getBody0();
        int partId = (m->getBody0() == m_ghostObject) ? pt.m_partId1 : pt.m_partId0;
        int triIdx = (m->getBody0() == m_ghostObject) ? pt.m_index1 : pt.m_index0;
        btTriangleShape triShape;
        if (btBuildInternalEdgeTriangleShape(triBody, partId, triIdx, triShape)) {
          const btTransform& triXf = triBody->getWorldTransform();
          btVector3 v0 = triXf * triShape.getVertexPtr(0);
          btVector3 v1 = triXf * triShape.getVertexPtr(1);
          btVector3 v2 = triXf * triShape.getVertexPtr(2);
          btVector3 e10 = v1 - v0, e20 = v2 - v0;
          btVector3 triNormal = e10.cross(e20);
          btScalar e0 = (v1 - v0).length();
          btScalar e1 = (v2 - v1).length();
          btScalar e2 = (v0 - v2).length();
          btScalar maxEdge = btMax(e0, btMax(e1, e2));
          if (triNormal.length2() > SIMD_EPSILON) triNormal.normalize();
          RFAIL("pair[%d] cp[%d] tri.v0=(%.4f,%.4f,%.4f)\n", i, p, v0.x(), v0.y(), v0.z());
          RFAIL("pair[%d] cp[%d] tri.v1=(%.4f,%.4f,%.4f)\n", i, p, v1.x(), v1.y(), v1.z());
          RFAIL("pair[%d] cp[%d] tri.v2=(%.4f,%.4f,%.4f)\n", i, p, v2.x(), v2.y(), v2.z());
          RFAIL("pair[%d] cp[%d] tri.normal=(%.4f,%.4f,%.4f) edges=(%.2f,%.2f,%.2f) maxEdge=%.2f\n",
                i, p, triNormal.x(), triNormal.y(), triNormal.z(), e0, e1, e2, maxEdge);
        }
      }
    }
  }

  RFAIL("=== end %s ===\n", phase);
  #undef RFAIL
}

void btKinematicCharacterController::recoverPreExistingPenetration(btCollisionWorld* collisionWorld) {
  int numPenetrationLoops = 0;
  while (recoverFromPenetration(collisionWorld)) {
    numPenetrationLoops++;
    if (numPenetrationLoops > MAX_PENETRATION_LOOPS) {
#if KCC_LOG_RECOVERY_FAIL
      printf("Character could not recover from pre-existing penetration after %d loops\n", numPenetrationLoops);
      dumpRecoveryFailureContext(collisionWorld, "preExisting", numPenetrationLoops);
#endif
      break;
    }
  }
}

void btKinematicCharacterController::stepUp(btCollisionWorld* world, btScalar& verticalOffset) {
  btScalar stepHeight = 0.0f;
  if (m_verticalVelocity < 0.) {
    stepHeight = m_stepHeight;
  }

  m_targetPosition = m_currentPosition;
  m_targetPosition += m_up * stepHeight;
  if (verticalOffset > 0.) {
    const btVector3 jumpOffset = m_jumpAxis * verticalOffset;
    m_targetPosition += parallelComponent(jumpOffset, m_up);
  }

  btTransform start, end;

  start.setIdentity();
  end.setIdentity();

  start.setOrigin(m_currentPosition);
  end.setOrigin(m_targetPosition);

  m_currentPosition = m_targetPosition;

  btKinematicClosestNotMeConvexResultCallback callback(m_ghostObject, -m_up, m_maxSlopeCosine);
  callback.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  m_ghostObject->convexSweepTest(m_convexShape, start, end, callback, world->getDispatchInfo().m_allowedCcdPenetration);

  if (callback.hasHit() && m_ghostObject->hasContactResponse() &&
      needsCollision(m_ghostObject, callback.m_hitCollisionObject)) {
    const btScalar hitDotUp = callback.m_hitNormalWorld.dot(m_up);
    // Only modify the position if the hit was a slope and not a wall or ceiling.
    if (hitDotUp > 0.) {
      // we moved up only a fraction of the step height
      m_currentStepOffset = stepHeight * callback.m_closestHitFraction;
      m_currentPosition.setInterpolate3(m_currentPosition, m_targetPosition, callback.m_closestHitFraction);
    } else {
      m_currentStepOffset = stepHeight;
    }

    btTransform& xform = m_ghostObject->getWorldTransform();
    xform.setOrigin(m_currentPosition);
    m_ghostObject->setWorldTransform(xform);

    // fix penetration if we hit a ceiling for example
    int numPenetrationLoops = 0;
    while (recoverFromPenetration(world)) {
      numPenetrationLoops += 1;
      if (numPenetrationLoops > MAX_PENETRATION_LOOPS) {
#if KCC_LOG_RECOVERY_FAIL
        printf("character could not recover from penetration in `stepUp` = %d\n", numPenetrationLoops);
        dumpRecoveryFailureContext(world, "stepUp", numPenetrationLoops);
#endif
        break;
      }
    }
    m_targetPosition = m_ghostObject->getWorldTransform().getOrigin();
    m_currentPosition = m_targetPosition;

    // Preserve upward momentum when the sweep hit a wall. The jump vector can be tilted,
    // so a lateral contact during stepUp should not behave like a ceiling and kill ascent.
    if (verticalOffset > 0 && hitDotUp < -0.3) {
      verticalOffset = 0.0;
      m_verticalVelocity = 0.0;
      m_currentStepOffset = m_stepHeight;
    }
  } else {
    m_currentStepOffset = stepHeight;
    m_currentPosition = m_targetPosition;
  }
}

bool btKinematicCharacterController::needsCollision(const btCollisionObject* body0, const btCollisionObject* body1) {
  bool collides = (body0->getBroadphaseHandle()->m_collisionFilterGroup & body1->getBroadphaseHandle()->m_collisionFilterMask) != 0;
  return collides && (body1->getBroadphaseHandle()->m_collisionFilterGroup & body0->getBroadphaseHandle()->m_collisionFilterMask);
}

void btKinematicCharacterController::updateTargetPositionBasedOnCollision(
  const btVector3& hitNormal,
  btScalar tangentMag,
  btScalar normalMag
) {
  btVector3 movementDirection = m_targetPosition - m_currentPosition;
  btScalar movementLength = movementDirection.length();
  if (movementLength <= SIMD_EPSILON) {
    return;
  }

  movementDirection.normalize();

  m_targetPosition = m_currentPosition;

  if (normalMag != 0.0) {
    btVector3 reflectDir = computeReflectionDirection(movementDirection, hitNormal).normalize();

    btVector3 perpindicularDir = perpindicularComponent(reflectDir, hitNormal);
    btVector3 perpComponent = perpindicularDir * btScalar(normalMag * movementLength);
    m_targetPosition += perpComponent;
  }
}

// When enabled, hitting two different planes in a single tick projects the remaining
// movement along the crease (intersection) of those planes instead of stopping dead.
// This eliminates oscillation and jank when sliding into V-shaped corners.
#define ENABLE_CREASE_PROJECTION 1

void btKinematicCharacterController::stepForwardAndStrafe(btCollisionWorld* collisionWorld, btScalar dt, btScalar verticalOffset) {
  btTransform start, end;
  start.setIdentity();
  end.setIdentity();

  m_targetPosition = m_currentPosition;
  m_targetPosition += m_walkDirection * dt;
  m_targetPosition += m_externalVelocity * dt;
  if (verticalOffset > 0.0) {
    const btVector3 jumpOffset = m_jumpAxis * verticalOffset;
    m_targetPosition += perpindicularComponent(jumpOffset, m_up);
  }

  btVector3 originalTarget = m_targetPosition;
  btScalar fraction = 1.0;
  btScalar distanceSquared = (m_currentPosition - m_targetPosition).length2();

  int maxIters = 10;

#if ENABLE_CREASE_PROJECTION
  // Track the first hit normal so we can detect two-plane (crease) contacts.
  btVector3 firstHitNormal(0, 0, 0);
  bool hasFirstHit = false;
#endif

  while (fraction > btScalar(0.01) && maxIters-- > 0) {
    start.setOrigin(m_currentPosition);
    end.setOrigin(m_targetPosition);
    btVector3 sweepDirNegative(m_currentPosition - m_targetPosition);

    btKinematicClosestNotMeConvexResultCallback callback(m_ghostObject, sweepDirNegative, btScalar(0.0));
    callback.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
    callback.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

    btScalar margin = m_convexShape->getMargin();
    m_convexShape->setMargin(margin + m_addedMargin);

    if (!(start == end)) {
      m_ghostObject->convexSweepTest(
        m_convexShape, start, end, callback, collisionWorld->getDispatchInfo().m_allowedCcdPenetration
      );
    }
    m_convexShape->setMargin(margin);

    fraction -= callback.m_closestHitFraction;

    if (callback.hasHit() && m_ghostObject->hasContactResponse() &&
        needsCollision(m_ghostObject, callback.m_hitCollisionObject)) {

      // Advance m_currentPosition to the hit point before adjusting the target.
      // This ensures progress is preserved even if we break out of the loop.
      btVector3 hitPosition;
      hitPosition.setInterpolate3(m_currentPosition, m_targetPosition, callback.m_closestHitFraction);
      m_currentPosition = hitPosition;

#if ENABLE_CREASE_PROJECTION
      if (!hasFirstHit) {
        // First plane hit: wall-slide as normal
        firstHitNormal = callback.m_hitNormalWorld;
        hasFirstHit = true;
        updateTargetPositionBasedOnCollision(callback.m_hitNormalWorld);
      } else {
        // Second (or later) plane hit: check if this is a different plane
        btScalar normalDot = firstHitNormal.dot(callback.m_hitNormalWorld);
        if (normalDot < btScalar(0.999)) {
          // Two distinct planes — compute the crease direction
          btVector3 crease = firstHitNormal.cross(callback.m_hitNormalWorld);
          btScalar creaseLen = crease.length();
          if (creaseLen > SIMD_EPSILON) {
            crease /= creaseLen;
            // Project remaining movement onto the crease
            btVector3 remaining = originalTarget - m_currentPosition;
            btScalar alongCrease = remaining.dot(crease);
            m_targetPosition = m_currentPosition + crease * alongCrease;
          } else {
            // Degenerate: near-parallel planes, just stop
            m_targetPosition = m_currentPosition;
            break;
          }
        } else {
          // Same plane again (e.g. curved surface) — normal wall-slide
          updateTargetPositionBasedOnCollision(callback.m_hitNormalWorld);
        }
      }
#else
      // Old behavior: wall-slide off the single plane
      updateTargetPositionBasedOnCollision(callback.m_hitNormalWorld);
#endif

      btVector3 currentDir = m_targetPosition - m_currentPosition;
      distanceSquared = currentDir.length2();
      if (distanceSquared <= SIMD_EPSILON) {
        break;
      }

      currentDir.normalize();
      // See Quake2: "If velocity is against original velocity, stop dead to avoid tiny oscillations in sloping corners."
      if (currentDir.dot(m_normalizedDirection) <= btScalar(0.)) {
        break;
      }
    } else {
      m_currentPosition = m_targetPosition;
    }
  }
}

void btKinematicCharacterController::stepDown(btCollisionWorld* collisionWorld, btScalar dt) {
  if (m_verticalVelocity > 0.) {
    KCC_GLOG("stepDn early-return (vy=%.3f > 0)\n", m_verticalVelocity);
    return;
  }

  btTransform start, end, endDouble;
  bool runOnce = false;
  btVector3 origTargetPosition = m_targetPosition;
  btScalar downVelocity = (m_verticalVelocity < 0.f ? -m_verticalVelocity : 0.f) * dt;

  if (downVelocity > 0. && downVelocity > m_terminalVelocity && (m_wasOnGround || !m_isJumping)) {
    downVelocity = m_terminalVelocity;
  }

  btVector3 stepDrop = m_up * (m_currentStepOffset + downVelocity);
  m_targetPosition -= stepDrop;

  btKinematicClosestNotMeConvexResultCallback callback(m_ghostObject, m_up, m_maxSlopeCosine);
  callback.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  btKinematicClosestNotMeConvexResultCallback callback2(m_ghostObject, m_up, m_maxSlopeCosine);
  callback2.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback2.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  while (1) {
    start.setIdentity();
    end.setIdentity();

    endDouble.setIdentity();

    start.setOrigin(m_currentPosition);
    end.setOrigin(m_targetPosition);

    // set double test for 2x the step drop, to check for a large drop vs small drop
    endDouble.setOrigin(m_targetPosition - stepDrop);

    m_ghostObject->convexSweepTest(
      m_convexShape, start, end, callback, collisionWorld->getDispatchInfo().m_allowedCcdPenetration
    );

    if (!callback.hasHit() && m_ghostObject->hasContactResponse()) {
      // test a double fall height, to see if the character should interpolate its fall (full) or not (partial)
      m_ghostObject->convexSweepTest(
        m_convexShape, start, endDouble, callback2, collisionWorld->getDispatchInfo().m_allowedCcdPenetration
      );
    }

    btScalar downVelocity2 = (m_verticalVelocity < 0.f ? -m_verticalVelocity : 0.f) * dt;
    bool hasHit = callback2.hasHit() && m_ghostObject->hasContactResponse() && needsCollision(m_ghostObject, callback2.m_hitCollisionObject);

    KCC_GLOG("stepDn sweep stepDrop=%.4f cb1.hit=%d cb1.frac=%.4f cb2.hit=%d cb2.frac=%.4f runOnce=%d\n",
             m_currentStepOffset + downVelocity,
             callback.hasHit() ? 1 : 0, callback.m_closestHitFraction,
             callback2.hasHit() ? 1 : 0, callback2.m_closestHitFraction,
             runOnce ? 1 : 0);

    btScalar stepHeight = m_verticalVelocity < 0.0 ? m_stepHeight : 0.0;

    if (!hasHit) {
#if KCC_STEPDOWN_FIXES
      // Fix 3: neither the small nor double sweep found a floor. If the player
      // was on ground last tick and the expected fall distance is small (i.e.
      // we "should" still be on ground), the floor has likely moved further
      // than 2*stepDrop in one tick — most often because floor-lock
      // over-applies upward motion on fast-rotating platforms. Retry once with
      // the fast-stairs range so cb2 reaches 2*stepHeight below; otherwise the
      // player drops to og=0, then the next tick's wasOG=0 skips floor-lock,
      // letting the floor catch up and deeply embed the capsule.
      if (!runOnce && m_wasOnGround && downVelocity2 > 0.0 && downVelocity2 < stepHeight) {
        m_targetPosition = origTargetPosition;
        downVelocity = stepHeight;
        stepDrop = m_up * (m_currentStepOffset + downVelocity);
        m_targetPosition -= stepDrop;
        runOnce = true;
        continue;
      }
#endif
      break;
    }

    if (downVelocity2 > 0.0 && downVelocity2 < stepHeight && !runOnce && (m_wasOnGround || !m_isJumping)) {
      // redo the velocity calculation when falling a small amount, for fast stairs motion
      // for larger falls, use the smoother/slower interpolated movement by not touching the target position

      m_targetPosition = origTargetPosition;
      downVelocity = stepHeight;

      stepDrop = m_up * (m_currentStepOffset + downVelocity);
      m_targetPosition -= stepDrop;
      runOnce = true;
      continue; // re-run previous tests
    }
    break;
  }

#if KCC_STEPDOWN_FIXES
  // Fix 4: tightened gate — only enter floorBlk if a sweep actually hit. Pre-fix
  // code accepted `runOnce` alone, which could enter with no real contact when
  // both sweeps missed in the second iteration.
  bool cb1Valid = m_ghostObject->hasContactResponse() && callback.hasHit() &&
                  needsCollision(m_ghostObject, callback.m_hitCollisionObject);
  bool cb2Valid = m_ghostObject->hasContactResponse() && callback2.hasHit() &&
                  needsCollision(m_ghostObject, callback2.m_hitCollisionObject);
  const bool enterFloorBlk = cb1Valid || (runOnce && cb2Valid);
#else
  const bool enterFloorBlk =
    (m_ghostObject->hasContactResponse() && callback.hasHit() &&
     needsCollision(m_ghostObject, callback.m_hitCollisionObject)) ||
    runOnce;
#endif

  if (enterFloorBlk) {
    // we dropped a fraction of the height -> hit floor
#if KCC_STEPDOWN_FIXES
    // Fix 1: when runOnce activated because cb1 missed but cb2 hit, use cb2's
    // hit data against the doubled endpoint. Pre-fix code used cb1's fraction
    // (=1.0 since cb1 never hit), placing the player at the full target which
    // is below the actual floor and forces recovery to push them up past
    // stepHeight on the next tick.
    bool useCb2 = runOnce && !cb1Valid && cb2Valid;
    if (useCb2) {
      btVector3 doubleEnd = m_targetPosition - stepDrop;
      m_currentPosition.setInterpolate3(m_currentPosition, doubleEnd, callback2.m_closestHitFraction);
    } else {
      m_currentPosition.setInterpolate3(m_currentPosition, m_targetPosition, callback.m_closestHitFraction);
    }
#else
    m_currentPosition.setInterpolate3(m_currentPosition, m_targetPosition, callback.m_closestHitFraction);
#endif

    m_verticalVelocity = 0.0;
    // Remove downward component of external velocity
    m_externalVelocity -= parallelComponent(m_externalVelocity, m_up);
    m_isJumping = false;
    m_onGround = true;

    // The block is also entered via `runOnce` after a fast-stairs retry, in
    // which case the second sweep can leave callback with no recorded hit
    // (m_hitCollisionObject = null). Guard the floor metadata writes so we
    // don't crash walking off a real ledge.
    if (callback.hasHit()) {
      m_floorObject = callback.m_hitCollisionObject;
      m_floorUserIndex = callback.m_hitCollisionObject->getUserIndex();
      m_floorNormal = callback.m_hitNormalWorld;
    }
#if KCC_STEPDOWN_FIXES
    else if (useCb2) {
      m_floorObject = callback2.m_hitCollisionObject;
      m_floorUserIndex = callback2.m_hitCollisionObject->getUserIndex();
      m_floorNormal = callback2.m_hitNormalWorld;
    }
    KCC_GLOG("stepDn floorBlk entered (cb1.hit=%d cb2.hit=%d runOnce=%d useCb2=%d) -> og=1 vy=0 floorIdx=%d\n",
             callback.hasHit() ? 1 : 0, callback2.hasHit() ? 1 : 0, runOnce ? 1 : 0, useCb2 ? 1 : 0,
             callback.hasHit() ? callback.m_hitCollisionObject->getUserIndex()
                               : (useCb2 ? callback2.m_hitCollisionObject->getUserIndex() : -1));
#else
    KCC_GLOG("stepDn floorBlk entered (cb1.hit=%d runOnce=%d) -> og=1 vy=0 floorIdx=%d\n",
             callback.hasHit() ? 1 : 0, runOnce ? 1 : 0,
             callback.hasHit() ? callback.m_hitCollisionObject->getUserIndex() : -1);
#endif
  } else if (callback2.hasHit() && m_ghostObject->hasContactResponse() &&
             needsCollision(m_ghostObject, callback2.m_hitCollisionObject)) {
    // The single-step sweep (callback) missed but the double-step probe
    // (callback2) found floor.  This happens when GJK fails to converge on the
    // shorter sweep against a numerically awkward triangle (e.g. extreme
    // aspect ratio from CSG output), and the fast-stairs `runOnce` retry
    // didn't fire (e.g. !m_wasOnGround or downVelocity2 >= stepHeight), so the
    // floorBlk's `useCb2` path doesn't catch it. Without this branch we'd
    // fall straight through the floor to m_targetPosition, and subsequent
    // ticks would be stuck inside the geometry because convexSweepTest
    // doesn't report initial overlap.  Use callback2's hit position to land
    // at the actual surface.
    //
    // callback2 swept from m_currentPosition to (m_targetPosition - stepDrop),
    // so the world hit position is interpolated along that longer segment.
    btVector3 endDoublePos = m_targetPosition - stepDrop;
    m_currentPosition.setInterpolate3(m_currentPosition, endDoublePos, callback2.m_closestHitFraction);

    m_verticalVelocity = 0.0;
    m_externalVelocity -= parallelComponent(m_externalVelocity, m_up);
    m_isJumping = false;
    m_onGround = true;

    m_floorObject = callback2.m_hitCollisionObject;
    m_floorUserIndex = callback2.m_hitCollisionObject->getUserIndex();
    m_floorNormal = callback2.m_hitNormalWorld;
  } else {
    m_currentPosition = m_targetPosition;
    KCC_GLOG("stepDn floorBlk skipped -> og stays %d, posY=%.4f\n",
             m_onGround ? 1 : 0, m_currentPosition.y());
  }
}

void btKinematicCharacterController::setWalkDirection(const btVector3& walkDirection) {
  m_walkDirection = walkDirection;
  m_normalizedDirection = getNormalizedVector(m_walkDirection);
}

void btKinematicCharacterController::warp(const btVector3& origin) {
  btTransform xform;
  xform.setIdentity();
  xform.setOrigin(origin);
  m_ghostObject->setWorldTransform(xform);
  m_currentPosition = origin;
  m_targetPosition = origin;
}

void btKinematicCharacterController::preStep(btCollisionWorld* collisionWorld) {
  m_currentPosition = m_ghostObject->getWorldTransform().getOrigin();
  m_targetPosition = m_currentPosition;
}

btScalar btKinematicCharacterController::computeShapedGravity() const {
  if (m_gravityShapeOnlyJumps && !m_isJumping) {
    return m_gravity;
  }

  if (m_gravityShapeRiseMultiplier == 1.0 && m_gravityShapeApexMultiplier == 1.0 &&
      m_gravityShapeFallMultiplier == 1.0) {
    return m_gravity;
  }

  btScalar v = m_verticalVelocity;
  btScalar absV = btFabs(v);
  btScalar threshold = m_gravityShapeApexThreshold;
  btScalar halfKnee = m_gravityShapeKneeWidth * 0.5;

  auto smoothstep = [](btScalar edge0, btScalar edge1, btScalar x) -> btScalar {
    if (edge1 <= edge0) {
      return x >= edge0 ? 1.0 : 0.0;
    }
    btScalar t = (x - edge0) / (edge1 - edge0);
    if (t <= 0.0) {
      return 0.0;
    } else if (t >= 1.0) {
      return 1.0;
    }
    return t * t * (3.0 - 2.0 * t);
  };

  btScalar outerMultiplier = v >= 0.0 ? m_gravityShapeRiseMultiplier : m_gravityShapeFallMultiplier;

  // blend from apexMultiplier (when |v| is near 0) to outerMultiplier (when |v| is large)
  btScalar blend = smoothstep(threshold - halfKnee, threshold + halfKnee, absV);
  btScalar multiplier = m_gravityShapeApexMultiplier + (outerMultiplier - m_gravityShapeApexMultiplier) * blend;

  return m_gravity * multiplier;
}

void btKinematicCharacterController::processInputPreamble(btScalar dt) {
  if (m_onGround) {
    m_lastGroundedTime = m_totalElapsedTime;
  }

  // Tick dash ground-touch requirement: clear once we've landed and the cooldown
  // has expired since the last dash.
  if (m_onGround && m_dashNeedsGroundTouch &&
      (m_totalElapsedTime - m_lastDashTime > m_minDashDelaySeconds)) {
    m_dashNeedsGroundTouch = false;
  }

  btVector3 moveDir(0, 0, 0);
  if (m_inputMovementEnabled) {
    if (m_topDownMode) {
      btScalar dx = 0, dz = 0;
      if (m_inputKeyFlags & 1) dz += btScalar(1);   // W
      if (m_inputKeyFlags & 2) dz -= btScalar(1);   // S
      if (m_inputKeyFlags & 4) dx += btScalar(1);   // A
      if (m_inputKeyFlags & 8) dx -= btScalar(1);   // D
      moveDir.setValue(dx, 0, dz);
    } else {
      // First/third-person: forward/left derived from camera azimuth (theta).
      // forward = (-sin(theta), 0, -cos(theta)), left = (-cos(theta), 0, sin(theta))
      btScalar sinTheta = btSin(m_inputTheta);
      btScalar cosTheta = btCos(m_inputTheta);
      btScalar dx = 0, dz = 0;
      if (m_inputKeyFlags & 1)  { dx -= sinTheta; dz -= cosTheta; }  // W
      if (m_inputKeyFlags & 2)  { dx += sinTheta; dz += cosTheta; }  // S
      if (m_inputKeyFlags & 4)  { dx -= cosTheta; dz += sinTheta; }  // A
      if (m_inputKeyFlags & 8)  { dx += cosTheta; dz -= sinTheta; }  // D
      moveDir.setValue(dx, 0, dz);
    }
    // Normalize with sqrt(2) factor so diagonal and cardinal movement share
    // the same target speed.
    btScalar len = moveDir.length();
    if (len > SIMD_EPSILON) {
      moveDir *= btScalar(1.41421356237) / len;
    }
  }
  m_lastMoveDir = moveDir;

  bool jumpFired = false;
  if (m_inputMovementEnabled && (m_inputKeyFlags & 16)) { // Space
    bool coyoteOk = m_coyoteTimeDuration > 0 &&
                    (m_totalElapsedTime - m_lastGroundedTime <= m_coyoteTimeDuration) &&
                    (m_totalElapsedTime - m_lastJumpTime > m_coyoteTimeDuration);
    bool cooldownOk = (m_totalElapsedTime - m_lastJumpTime > m_minJumpDelaySeconds);

    if ((m_onGround || coyoteOk) && cooldownOk) {
      btVector3 jumpVec(
        moveDir.x() * (m_defaultJumpSpeed * btScalar(0.18)),
        m_defaultJumpSpeed,
        moveDir.z() * (m_defaultJumpSpeed * btScalar(0.18))
      );
      jump(jumpVec);
      m_lastJumpTime     = m_totalElapsedTime;
      m_lastGroundedTime = btScalar(-1e30);
      m_onGround         = false;
      jumpFired          = true;

      btZoneEvent evt;
      evt.m_zoneId    = -1;
      evt.m_eventType = ZONE_EVENT_JUMP_FIRED;
      m_pendingEvents.push_back(evt);
    }
  }

  if (m_dashEnabled && m_inputMovementEnabled && (m_inputKeyFlags & 32)) {  // Shift
    bool hasCharges = !std::isfinite(m_dashCharges) || m_dashCharges > btScalar(0);
    bool cooldownOk = (m_totalElapsedTime - m_lastDashTime > m_minDashDelaySeconds);
    if (hasCharges && cooldownOk && !m_dashNeedsGroundTouch) {
      btVector3 dashDir;
      if (m_topDownMode) {
        // Blend horizontal move direction with up for a slight upward arc.
        btVector3 blended = moveDir * btScalar(0.5) + m_up * btScalar(0.5);
        btScalar blen = blended.length();
        dashDir = (blen > SIMD_EPSILON) ? blended / blen : m_up;
      } else {
        // 3D camera direction from spherical coordinates (phi = polar from +Y, theta = azimuth)
        btScalar sinPhi   = btSin(m_inputPhi);
        btScalar cosPhi   = btCos(m_inputPhi);
        btScalar sinTheta = btSin(m_inputTheta);
        btScalar cosTheta = btCos(m_inputTheta);
        dashDir.setValue(-sinPhi * sinTheta, -cosPhi, -sinPhi * cosTheta);
        btScalar dlen = dashDir.length();
        if (dlen > SIMD_EPSILON) {
          dashDir /= dlen;
        }
      }

      if (m_dashUseExternalVelocity) {
        btScalar scale = m_dashMagnitude * btScalar(1.28);
        m_externalVelocity = dashDir * scale;
        resetFall();
      } else {
        jump(dashDir * m_dashMagnitude);
      }

      m_lastDashDir = dashDir;
      m_lastDashTime = m_totalElapsedTime;
      m_dashNeedsGroundTouch = true;
      if (std::isfinite(m_dashCharges)) {
        m_dashCharges = btMax(btScalar(0), m_dashCharges - btScalar(1));
      }

      btZoneEvent evt;
      evt.m_zoneId = -1;
      evt.m_eventType = ZONE_EVENT_DASH_FIRED;
      m_pendingEvents.push_back(evt);
    }
  }

  btScalar moveSpeed = (m_onGround && !jumpFired) ? m_moveSpeedGround : m_moveSpeedInAir;
  m_walkDirection = moveDir * moveSpeed;
  m_normalizedDirection = getNormalizedVector(m_walkDirection);
}

void btKinematicCharacterController::playerStep(btCollisionWorld* collisionWorld, btScalar dt) {
  m_totalElapsedTime += dt;

  // Capture ground-state-evolution snapshots so the post-tick log line can
  // show wasOnGround vs end-of-prev-tick m_onGround vs the value as seen by
  // floor-lock and stepDown. Cheap stack locals; only consumed by KCC_GLOG.
  KCC_GLOG("in t=%.4f og=%d posY=%.4f vy=%.3f currPosY=%.4f\n",
           m_totalElapsedTime, m_onGround ? 1 : 0,
           m_ghostObject->getWorldTransform().getOrigin().y(),
           m_verticalVelocity, m_currentPosition.y());

  processInputPreamble(dt);

  m_wasOnGround = onGround();
  maybeApplyFloorLock(collisionWorld);

  KCC_GLOG("post-floorLock wasOG=%d og=%d posY=%.4f\n",
           m_wasOnGround ? 1 : 0, m_onGround ? 1 : 0, m_currentPosition.y());

  m_onGround = false;

  m_verticalVelocity -= computeShapedGravity() * dt;
  if (m_verticalVelocity < 0.0 && btFabs(m_verticalVelocity) > btFabs(m_terminalVelocity)) {
    m_verticalVelocity = -btFabs(m_terminalVelocity);
  }
  btScalar verticalOffset = m_verticalVelocity * dt;

  // apply damping to external velocity
  btVector3 dampingFactor = m_wasOnGround ? m_externalVelocityGroundDampingFactor : m_externalVelocityAirDampingFactor;
  btVector3 externalVelocityMultiplier = (btVector3(1., 1., 1.) - dampingFactor).pow(dt);
  m_externalVelocity *= externalVelocityMultiplier;

  // if in the air, use directional input to change the direction of external velocity while retaining its magnitude
  //
  // this allows for dashes, boosts, etc. to be controlled rather than just fighting against them with the static
  // velocity normally applied by kinematic movement
  if (!m_wasOnGround && m_normalizedDirection.length2() > 0.0) {
    btVector3 verticalComponent = parallelComponent(m_externalVelocity, m_up);

    btVector3 horizontalComponent = m_externalVelocity - verticalComponent;
    btScalar horizontalMag = horizontalComponent.length();

    if (horizontalMag > SIMD_EPSILON) {
      btVector3 horizontalDir = horizontalComponent / horizontalMag;
      btVector3 newHorizontalDir = m_normalizedDirection;
      newHorizontalDir.normalize();
      horizontalComponent = newHorizontalDir * horizontalMag;
    } else {
      horizontalComponent = m_normalizedDirection * horizontalMag;
    }

    m_externalVelocity = verticalComponent + horizontalComponent;
  }

  // clear external velocity if it's very low-magnitude to avoid sliding around on small inclines etc.
  if (m_externalVelocity.length2() < 0.0003) {
    m_externalVelocity.setValue(0.0, 0.0, 0.0);
  }

#if 0
  recoverPreExistingPenetration(collisionWorld);
#endif

  const btScalar dbgPreStepUpY = m_currentPosition.y();
  stepUp(collisionWorld, verticalOffset);

  KCC_GLOG("post-stepUp og=%d posY=%.4f dY=%+.4f\n",
           m_onGround ? 1 : 0, m_currentPosition.y(),
           m_currentPosition.y() - dbgPreStepUpY);

  const btScalar dbgPreStepFwdY = m_currentPosition.y();
  stepForwardAndStrafe(collisionWorld, dt, verticalOffset);

  KCC_GLOG("post-stepFwd og=%d posY=%.4f dY=%+.4f\n",
           m_onGround ? 1 : 0, m_currentPosition.y(),
           m_currentPosition.y() - dbgPreStepFwdY);

  const btScalar dbgPreStepDownY = m_currentPosition.y();
  stepDown(collisionWorld, dt);

  KCC_GLOG("post-stepDn og=%d posY=%.4f dY=%+.4f vy=%.3f floorIdx=%d\n",
           m_onGround ? 1 : 0, m_currentPosition.y(),
           m_currentPosition.y() - dbgPreStepDownY,
           m_verticalVelocity,
           m_floorObject ? m_floorObject->getUserIndex() : -1);

  // Slope sliding: when on ground and the floor is steeper than the slide threshold,
  // push the player downhill.  Speed scales linearly from 0 at minAngle to maxSpeed at maxSlope.
  if (m_onGround && m_slopeSlideMinAngle > 0) {
    btScalar floorDotUp = m_floorNormal.dot(m_up);
    // floorDotUp < slopeSlideMinAngleCosine means the surface is steeper than minAngle
    if (floorDotUp < m_slopeSlideMinAngleCosine && floorDotUp > m_maxSlopeCosine) {
      // Compute downhill direction: project gravity onto the surface plane
      btVector3 downhill = -m_up - m_floorNormal * (-m_up).dot(m_floorNormal);
      btScalar downhillLen = downhill.length();
      if (downhillLen > SIMD_EPSILON) {
        downhill /= downhillLen;
        // Interpolate speed: 0 at minAngle, maxSpeed at maxSlope
        btScalar t = (m_slopeSlideMinAngleCosine - floorDotUp) /
                     (m_slopeSlideMinAngleCosine - m_maxSlopeCosine);
        btScalar speed = m_slopeSlideMaxSpeed * t;
        m_currentPosition += downhill * speed * dt;
      }
    }
  }

  processJumpPads(collisionWorld, dt);
  processBoostZones(collisionWorld, dt);
  processDashTokens(collisionWorld);
  processSensors(collisionWorld);

  btTransform xform = m_ghostObject->getWorldTransform();
  xform.setOrigin(m_currentPosition);
  m_ghostObject->setWorldTransform(xform);

  const btScalar dbgPreRecoverY = m_currentPosition.y();
#if KCC_STEPDOWN_FIXES
  const btVector3 preRecoverPos = m_currentPosition;
#endif
  int numPenetrationLoops = 0;
  while (recoverFromPenetration(collisionWorld)) {
    numPenetrationLoops++;
    if (numPenetrationLoops > MAX_PENETRATION_LOOPS) {
#if KCC_LOG_RECOVERY_FAIL
      printf("character could not recover from penetration in `stepDown` = %d\n", numPenetrationLoops);
      dumpRecoveryFailureContext(collisionWorld, "stepDown", numPenetrationLoops);
#endif
      break;
    }
  }

#if KCC_STEPDOWN_FIXES
  // Fix 2: cap cumulative upward recovery at slightly less than stepHeight. If
  // recovery pushes the player higher than that on a tick where they ended on
  // ground, the next tick's stepDown sweep (range ≈ stepHeight + downVel for
  // cb1, 2× for cb2) can no longer reach the floor — producing the og=1↔0
  // flicker observed on rotating-platform surfaces. Any residual penetration
  // left here is resolved by the next tick's recovery pass, so this cap defers
  // rather than discards work.
  btScalar verticalRecovery = (m_currentPosition - preRecoverPos).dot(m_up);
  btScalar capRecovery = m_stepHeight - btScalar(0.001);
  if (m_onGround && verticalRecovery > capRecovery && capRecovery > 0.) {
    m_currentPosition -= m_up * (verticalRecovery - capRecovery);
    btTransform xform = m_ghostObject->getWorldTransform();
    xform.setOrigin(m_currentPosition);
    m_ghostObject->setWorldTransform(xform);
    KCC_GLOG("post-rec capped from dY=%+.4f to dY=%+.4f\n", verticalRecovery, capRecovery);
  }
#endif

  KCC_GLOG("post-rec iters=%d og=%d posY=%.4f dY=%+.4f\n",
           numPenetrationLoops, m_onGround ? 1 : 0, m_currentPosition.y(),
           m_currentPosition.y() - dbgPreRecoverY);
  KCC_GLOG("out og=%d posY=%.4f vy=%.3f floorIdx=%d wasOG=%d\n",
           m_onGround ? 1 : 0, m_currentPosition.y(), m_verticalVelocity,
           m_floorObject ? m_floorObject->getUserIndex() : -1,
           m_wasOnGround ? 1 : 0);
}

void btKinematicCharacterController::setJumpSpeed(btScalar jumpSpeed) {
  m_defaultJumpSpeed = jumpSpeed;
}

void btKinematicCharacterController::jump(const btVector3& v) {
  m_verticalVelocity = v.length2() == 0 ? m_defaultJumpSpeed : v.length();
  m_isJumping = true;

  m_jumpAxis = v.length2() == 0 ? m_up : v.normalized();
}

void btKinematicCharacterController::setGravity(const btVector3& gravity) {
  if (gravity.length2() > 0) {
    setUpVector(-gravity);
  }

  m_gravity = gravity.length();
}

void btKinematicCharacterController::setUp(const btVector3& up) {
  if (up.length2() > 0 && m_gravity > 0.0f) {
    setGravity(-m_gravity * up.normalized());
    return;
  }

  setUpVector(up);
}

bool btKinematicCharacterController::checkZoneOverlap(btCollisionWorld* world, btPairCachingGhostObject* zoneGhost) {
  if (zoneGhost->getNumOverlappingObjects() == 0) {
    return false;
  }
  return world->contactPairTestBinary(zoneGhost, m_ghostObject, 0.);
}

bool btKinematicCharacterController::checkZoneOverlapWithPenetration(
  btCollisionWorld* world,
  btPairCachingGhostObject* zoneGhost,
  btScalar minPenetrationDepth
) {
  if (zoneGhost->getNumOverlappingObjects() == 0) {
    return false;
  }
  return world->contactPairTestBinary(zoneGhost, m_ghostObject, minPenetrationDepth);
}

void btKinematicCharacterController::processJumpPads(btCollisionWorld* collisionWorld, btScalar dt) {
  for (int i = 0; i < m_jumpPads.size(); i++) {
    btJumpPad* pad = m_jumpPads[i];

    if (!pad->m_enabled) {
      continue;
    }

    bool wasOverlapping = pad->m_isOverlapping;
    bool isOverlapping = checkZoneOverlap(collisionWorld, pad->m_ghostObject);
    pad->m_isOverlapping = isOverlapping;

    // Only trigger on entry (not while staying inside)
    if (!isOverlapping || wasOverlapping) {
      continue;
    }

    // Cooldown check
    if ((m_totalElapsedTime - pad->m_lastTriggerTime) < pad->m_cooldownSeconds) {
      continue;
    }

    // Compute approach speed
    btVector3 playerVel = m_walkDirection + m_externalVelocity;
    playerVel += m_up * m_verticalVelocity;
    btScalar approachSpeed = btMax(btScalar(0), playerVel.dot(-pad->m_direction));

    // Decompose pad direction into vertical and horizontal components
    btScalar verticalComponent = pad->m_direction.dot(m_up);
    btVector3 horizontalDir = pad->m_direction - m_up * verticalComponent;
    if (horizontalDir.length2() > SIMD_EPSILON) {
      horizontalDir.normalize();
    }

    // Set vertical velocity for upward launch
    m_verticalVelocity = pad->m_baseImpulse * verticalComponent;
    m_jumpAxis = m_up;
    m_isJumping = true;

    // Add horizontal boost via external velocity
    btVector3 horizontalBoost = horizontalDir * (pad->m_baseImpulse * (btScalar(1) - btFabs(verticalComponent)));
    horizontalBoost += horizontalDir * (approachSpeed * pad->m_speedScaling);
    m_externalVelocity += horizontalBoost;

    // Clear downward external velocity to prevent fighting the launch
    btScalar vertExtVel = m_externalVelocity.dot(m_up);
    if (vertExtVel < 0) {
      m_externalVelocity -= m_up * vertExtVel;
    }

    pad->m_lastTriggerTime = m_totalElapsedTime;
    // Jump pad resets the dash ground-touch requirement so the player can
    // chain dashes off of pads without needing a normal landing.
    m_dashNeedsGroundTouch = false;

    btZoneEvent evt;
    evt.m_zoneId = pad->m_zoneId;
    evt.m_eventType = ZONE_EVENT_JUMP_PAD_TRIGGERED;
    m_pendingEvents.push_back(evt);
  }
}

void btKinematicCharacterController::processBoostZones(btCollisionWorld* collisionWorld, btScalar dt) {
  for (int i = 0; i < m_boostZones.size(); i++) {
    btBoostZone* zone = m_boostZones[i];

    if (!zone->m_enabled) {
      continue;
    }

    bool wasOverlapping = zone->m_isOverlapping;
    bool isOverlapping = checkZoneOverlap(collisionWorld, zone->m_ghostObject);
    zone->m_isOverlapping = isOverlapping;

    if (isOverlapping && !wasOverlapping) {
      btZoneEvent evt;
      evt.m_zoneId = zone->m_zoneId;
      evt.m_eventType = ZONE_EVENT_BOOST_ZONE_ENTER;
      m_pendingEvents.push_back(evt);
    }
    if (!isOverlapping && wasOverlapping) {
      btZoneEvent evt;
      evt.m_zoneId = zone->m_zoneId;
      evt.m_eventType = ZONE_EVENT_BOOST_ZONE_EXIT;
      m_pendingEvents.push_back(evt);
    }

    if (isOverlapping) {
      // Compute alignment factor
      btScalar alignmentFactor = btScalar(1.0);
      if (zone->m_directionalBias > 0 && m_normalizedDirection.length2() > 0) {
        btScalar alignment = m_normalizedDirection.dot(zone->m_direction);
        alignmentFactor = btScalar(1.0) + zone->m_directionalBias * (btMax(btScalar(0), alignment) - btScalar(1.0));
      }

      btVector3 boost = zone->m_direction * zone->m_strength * alignmentFactor * dt;
      m_externalVelocity += boost;
    }
  }
}

void btKinematicCharacterController::processSensors(btCollisionWorld* collisionWorld) {
  for (int i = 0; i < m_sensors.size(); i++) {
    btSensor* sensor = m_sensors[i];

    if (!sensor->m_enabled) {
      continue;
    }

    bool isOverlapping = checkZoneOverlapWithPenetration(
      collisionWorld, sensor->m_ghostObject, sensor->m_minPenetrationDepth
    );
    bool wasOverlapping = sensor->m_isOverlapping;
    sensor->m_isOverlapping = isOverlapping;

    if (isOverlapping && !wasOverlapping) {
      btZoneEvent evt;
      evt.m_zoneId = sensor->m_zoneId;
      evt.m_eventType = ZONE_EVENT_SENSOR_ENTER;
      m_pendingEvents.push_back(evt);
    }
    if (!isOverlapping && wasOverlapping) {
      btZoneEvent evt;
      evt.m_zoneId = sensor->m_zoneId;
      evt.m_eventType = ZONE_EVENT_SENSOR_LEAVE;
      m_pendingEvents.push_back(evt);
    }
  }
}

void btKinematicCharacterController::processDashTokens(btCollisionWorld* collisionWorld) {
  for (int i = 0; i < m_dashTokens.size(); i++) {
    btDashToken* token = m_dashTokens[i];

    if (!token->m_enabled || !token->m_active) {
      token->m_isOverlapping = false;
      continue;
    }

    bool isOverlapping = checkZoneOverlapWithPenetration(
      collisionWorld, token->m_ghostObject, token->m_minPenetrationDepth
    );
    bool wasOverlapping = token->m_isOverlapping;
    token->m_isOverlapping = isOverlapping;

    if (!isOverlapping || wasOverlapping) {
      continue;
    }

    if (std::isfinite(m_dashCharges)) {
      m_dashCharges += btScalar(token->m_chargesGranted);
    }
    token->m_active = false;
    token->m_isOverlapping = false;

    btZoneEvent evt;
    evt.m_zoneId = token->m_zoneId;
    evt.m_eventType = ZONE_EVENT_DASH_TOKEN_COLLECTED;
    m_pendingEvents.push_back(evt);
  }
}

void btKinematicCharacterController::setUpVector(const btVector3& up) {
  if (m_up == up) {
    return;
  }

  btVector3 oldUp = m_up;

  if (up.length2() > 0) {
    m_up = up.normalized();
  } else {
    m_up = btVector3(0.0, 0.0, 0.0);
  }

  if (!m_ghostObject) {
    return;
  }
  btQuaternion rot = getRotation(m_up, oldUp);

  // set orientation with new up
  btTransform xform = m_ghostObject->getWorldTransform();
  btQuaternion orn = rot.inverse() * xform.getRotation();
  xform.setRotation(orn);
  m_ghostObject->setWorldTransform(xform);
}

btQuaternion btKinematicCharacterController::getRotation(btVector3& v0, btVector3& v1) const {
  if (v0.length2() == 0.0f || v1.length2() == 0.0f) {
    btQuaternion q;
    return q;
  }

  return shortestArcQuatNormalize2(v0, v1);
}

float btKinematicCharacterController::cameraRayTest(
  btCollisionWorld* world,
  btScalar fromX, btScalar fromY, btScalar fromZ,
  btScalar toX,   btScalar toY,   btScalar toZ) {
  btVector3 from(fromX, fromY, fromZ);
  btVector3 to(toX, toY, toZ);

  btKinematicClosestNotMeRayResultCallback callback(m_ghostObject);
  callback.m_collisionFilterMask = btBroadphaseProxy::StaticFilter | btBroadphaseProxy::DefaultFilter;
  // Preserve raw triangle normals so callers can distinguish front-face vs
  // back-face hits (needed for camera-inside-geometry detection).
  callback.m_flags |= btTriangleRaycastCallback::kF_KeepUnflippedNormal;

  world->rayTest(from, to, callback);
  if (callback.hasHit()) {
    m_cameraRayHitNX = callback.m_hitNormalWorld.x();
    m_cameraRayHitNY = callback.m_hitNormalWorld.y();
    m_cameraRayHitNZ = callback.m_hitNormalWorld.z();
    m_cameraRayHitNonPermeable = callback.m_collisionObject->getUserIndex2() > 0;
  } else {
    m_cameraRayHitNX = 0;
    m_cameraRayHitNY = 0;
    m_cameraRayHitNZ = 0;
    m_cameraRayHitNonPermeable = false;
  }
  return callback.m_closestHitFraction;
}

int btKinematicCharacterController::packState(void* outPtr) const {
  float* outBuffer = static_cast<float*>(outPtr);
  outBuffer[0] = m_currentPosition.x();
  outBuffer[1] = m_currentPosition.y();
  outBuffer[2] = m_currentPosition.z();
  outBuffer[3] = m_externalVelocity.x();
  outBuffer[4] = m_externalVelocity.y();
  outBuffer[5] = m_externalVelocity.z();
  outBuffer[6] = m_verticalVelocity;
  // Pack boolean flags into a u32, then bitcast to float
  unsigned int flags = 0;
  if (m_onGround) flags |= 1;
  if (m_isJumping) flags |= 2;
  float flagsAsFloat;
  memcpy(&flagsAsFloat, &flags, sizeof(float));
  outBuffer[7] = flagsAsFloat;
  // Pack floor user index (i32 -> float bitcast)
  float floorIndexAsFloat;
  memcpy(&floorIndexAsFloat, &m_floorUserIndex, sizeof(float));
  outBuffer[8] = floorIndexAsFloat;
  return 9;
}

void btKinematicCharacterController::resetCollisionCache(
  btDiscreteDynamicsWorld* world, short filterGroup, short filterMask
) {
  world->removeAction(this);
  world->removeCollisionObject(m_ghostObject);
  world->addCollisionObject(m_ghostObject, filterGroup, filterMask);
  world->addAction(this);
}
