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
#include "BulletCollision/BroadphaseCollision/btCollisionAlgorithm.h"
#include "BulletCollision/BroadphaseCollision/btOverlappingPairCache.h"
#include "BulletCollision/CollisionDispatch/btCollisionWorld.h"
#include "BulletCollision/CollisionDispatch/btGhostObject.h"
#include "BulletCollision/CollisionShapes/btMultiSphereShape.h"
#include "LinearMath/btDefaultMotionState.h"
#include "LinearMath/btIDebugDraw.h"
#include <stdio.h>

static btVector3
getNormalizedVector(const btVector3& v) {
  btVector3 n(0, 0, 0);

  if (v.length() > SIMD_EPSILON) {
    n = v.normalized();
  }
  return n;
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
    if (convexResult.m_hitCollisionObject == m_me) {
      return 1.0;
    }

    if (!convexResult.m_hitCollisionObject->hasContactResponse()) {
      return 1.0;
    }

    btVector3 hitNormalWorld;
    if (normalInWorldSpace) {
      hitNormalWorld = convexResult.m_hitNormalLocal;
    } else {
      // need to transform normal into worldspace
      hitNormalWorld =
        convexResult.m_hitCollisionObject->getWorldTransform().getBasis() * convexResult.m_hitNormalLocal;
    }

    btScalar dotUp = m_up.dot(hitNormalWorld);
    if (dotUp < m_minSlopeDot) {
      return 1.0;
    }

    return ClosestConvexResultCallback::addSingleResult(convexResult, normalInWorldSpace);
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
btVector3
btKinematicCharacterController::computeReflectionDirection(const btVector3& direction, const btVector3& normal) {
  return direction - (btScalar(2.0) * direction.dot(normal)) * normal;
}

/*
 * Returns the portion of 'direction' that is parallel to 'normal'
 */
btVector3
btKinematicCharacterController::parallelComponent(const btVector3& direction, const btVector3& normal) {
  btScalar magnitude = direction.dot(normal);
  return normal * magnitude;
}

/*
 * Returns the portion of 'direction' that is perpindicular to 'normal'
 */
btVector3
btKinematicCharacterController::perpindicularComponent(const btVector3& direction, const btVector3& normal) {
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
  m_turnAngle = btScalar(0.0);
  m_convexShape = convexShape;
  m_velocityTimeInterval = 0.0;
  m_verticalVelocity = 0.0;
  m_verticalOffset = 0.0;
  m_gravity = 9.8 * 3.0;
  m_terminalVelocity = 55.0;
  m_jumpSpeed = 10.0;
  m_SetjumpSpeed = m_jumpSpeed;
  m_wasOnGround = false;
  m_wasJumping = false;
  m_currentStepOffset = 0.0;
  m_maxPenetrationDepth = 0.2;
  full_drop = false;

  setUp(up);
  setStepHeight(stepHeight);
  setMaxSlope(btRadians(45.0));
}

btKinematicCharacterController::~btKinematicCharacterController() {}

bool
btKinematicCharacterController::recoverFromPenetration(btCollisionWorld* collisionWorld) {
  // Here we must refresh the overlapping paircache as the penetrating movement itself or the
  // previous recovery iteration might have used setWorldTransform and pushed us into an object
  // that is not in the previous cache contents from the last timestep, as will happen if we
  // are pushed into a new AABB overlap. Unhandled this means the next convex sweep gets stuck.
  //
  // Do this by calling the broadphase's setAabb with the moved AABB, this will update the broadphase
  // paircache and the ghostobject's internal paircache at the same time.    /BW

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
        const btManifoldPoint& pt = manifold->getContactPoint(p);

        btScalar dist = pt.getDistance();

        if (dist < -m_maxPenetrationDepth) {
          m_currentPosition += pt.m_normalWorldOnB * directionSign * dist * btScalar(1. / 8.);
          penetration = true;
        }
      }
    }
  }
  btTransform newTrans = m_ghostObject->getWorldTransform();
  newTrans.setOrigin(m_currentPosition);
  m_ghostObject->setWorldTransform(newTrans);
  //	printf("m_touchingNormal = %f,%f,%f\n",m_touchingNormal[0],m_touchingNormal[1],m_touchingNormal[2]);
  return penetration;
}

void
btKinematicCharacterController::stepUp(btCollisionWorld* world) {
  btScalar stepHeight = 0.0f;
  if (m_verticalVelocity < 0.0) {
    stepHeight = m_stepHeight;
  }

  // phase 1: up
  btTransform start, end;

  start.setIdentity();
  end.setIdentity();

  /* FIXME: Handle penetration properly */
  start.setOrigin(m_currentPosition);

  m_targetPosition =
    m_currentPosition + m_up * stepHeight + m_jumpAxis * (m_verticalOffset > 0.f ? m_verticalOffset : 0.f);
  m_currentPosition = m_targetPosition;

  end.setOrigin(m_targetPosition);

  btKinematicClosestNotMeConvexResultCallback callback(m_ghostObject, -m_up, m_maxSlopeCosine);
  callback.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  m_ghostObject->convexSweepTest(m_convexShape, start, end, callback, world->getDispatchInfo().m_allowedCcdPenetration);

  if (callback.hasHit() && m_ghostObject->hasContactResponse() && needsCollision(m_ghostObject, callback.m_hitCollisionObject)) {
    // Only modify the position if the hit was a slope and not a wall or ceiling.
    if (callback.m_hitNormalWorld.dot(m_up) > 0.0) {
      // we moved up only a fraction of the step height
      m_currentStepOffset = stepHeight * callback.m_closestHitFraction;
      m_currentPosition.setInterpolate3(m_currentPosition, m_targetPosition, callback.m_closestHitFraction);
    }

    btTransform& xform = m_ghostObject->getWorldTransform();
    xform.setOrigin(m_currentPosition);
    m_ghostObject->setWorldTransform(xform);

    // fix penetration if we hit a ceiling for example
    int numPenetrationLoops = 0;
    m_touchingContact = false;
    while (recoverFromPenetration(world)) {
      numPenetrationLoops++;
      m_touchingContact = true;
      if (numPenetrationLoops > 8) {
        // printf("character could not recover from penetration in `stepUp` = %d\n", numPenetrationLoops);
        break;
      }
    }
    m_targetPosition = m_ghostObject->getWorldTransform().getOrigin();
    m_currentPosition = m_targetPosition;

    if (m_verticalOffset > 0) {
      m_verticalOffset = 0.0;
      m_verticalVelocity = 0.0;
      m_currentStepOffset = m_stepHeight;
    }
  } else {
    m_currentStepOffset = stepHeight;
    m_currentPosition = m_targetPosition;
  }
}

bool
btKinematicCharacterController::needsCollision(const btCollisionObject* body0, const btCollisionObject* body1) {
  bool collides =
    (body0->getBroadphaseHandle()->m_collisionFilterGroup & body1->getBroadphaseHandle()->m_collisionFilterMask) != 0;
  return collides &&
         (body1->getBroadphaseHandle()->m_collisionFilterGroup & body0->getBroadphaseHandle()->m_collisionFilterMask);
}

void
btKinematicCharacterController::updateTargetPositionBasedOnCollision(
  const btVector3& hitNormal,
  btScalar tangentMag,
  btScalar normalMag
) {
  btVector3 movementDirection = m_targetPosition - m_currentPosition;
  btScalar movementLength = movementDirection.length();
  if (movementLength > SIMD_EPSILON) {
    movementDirection.normalize();

    btVector3 reflectDir = computeReflectionDirection(movementDirection, hitNormal);
    reflectDir.normalize();

    btVector3 parallelDir, perpindicularDir;

    parallelDir = parallelComponent(reflectDir, hitNormal);
    perpindicularDir = perpindicularComponent(reflectDir, hitNormal);

    m_targetPosition = m_currentPosition;

    if (normalMag != 0.0) {
      btVector3 perpComponent = perpindicularDir * btScalar(normalMag * movementLength);
      m_targetPosition += perpComponent;
    }
  }
}

void
btKinematicCharacterController::stepForwardAndStrafe(btCollisionWorld* collisionWorld, const btVector3& walkMove) {
  // phase 2: forward and strafe
  btTransform start, end;

  m_targetPosition = m_currentPosition + walkMove;

  start.setIdentity();
  end.setIdentity();

  btScalar fraction = 1.0;
  btScalar distance2 = (m_currentPosition - m_targetPosition).length2();

  int maxIter = 10;

  while (fraction > btScalar(0.01) && maxIter-- > 0) {
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

    if (callback.hasHit() && m_ghostObject->hasContactResponse() && needsCollision(m_ghostObject, callback.m_hitCollisionObject)) {
      // we moved only a fraction
      updateTargetPositionBasedOnCollision(callback.m_hitNormalWorld);
      btVector3 currentDir = m_targetPosition - m_currentPosition;
      distance2 = currentDir.length2();
      if (distance2 <= SIMD_EPSILON) {
        break;
      }

      currentDir.normalize();
      // See Quake2: "If velocity is against original velocity, stop ead to avoid tiny oscilations in sloping corners."
      if (currentDir.dot(m_normalizedDirection) <= btScalar(0.0)) {
        break;
      }
    } else {
      m_currentPosition = m_targetPosition;
    }
  }
}

void
btKinematicCharacterController::stepDown(btCollisionWorld* collisionWorld, btScalar dt) {
  btTransform start, end, end_double;
  bool runonce = false;

  // phase 3: down
  btVector3 orig_position = m_targetPosition;

  btScalar downVelocity = (m_verticalVelocity < 0.f ? -m_verticalVelocity : 0.f) * dt;

  if (m_verticalVelocity > 0.0) {
    return;
  }

  if (downVelocity > 0.0 && downVelocity > m_terminalVelocity && (m_wasOnGround || !m_wasJumping)) {
    downVelocity = m_terminalVelocity;
  }

  btVector3 step_drop = m_up * (m_currentStepOffset + downVelocity);
  m_targetPosition -= step_drop;

  btKinematicClosestNotMeConvexResultCallback callback(m_ghostObject, m_up, m_maxSlopeCosine);
  callback.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  btKinematicClosestNotMeConvexResultCallback callback2(m_ghostObject, m_up, m_maxSlopeCosine);
  callback2.m_collisionFilterGroup = m_ghostObject->getBroadphaseHandle()->m_collisionFilterGroup;
  callback2.m_collisionFilterMask = m_ghostObject->getBroadphaseHandle()->m_collisionFilterMask;

  while (1) {
    start.setIdentity();
    end.setIdentity();

    end_double.setIdentity();

    start.setOrigin(m_currentPosition);
    end.setOrigin(m_targetPosition);

    // set double test for 2x the step drop, to check for a large drop vs small drop
    end_double.setOrigin(m_targetPosition - step_drop);

    m_ghostObject->convexSweepTest(
      m_convexShape, start, end, callback, collisionWorld->getDispatchInfo().m_allowedCcdPenetration
    );

    if (!callback.hasHit() && m_ghostObject->hasContactResponse()) {
      // test a double fall height, to see if the character should interpolate its fall (full) or not (partial)
      m_ghostObject->convexSweepTest(
        m_convexShape, start, end_double, callback2, collisionWorld->getDispatchInfo().m_allowedCcdPenetration
      );
    }

    btScalar downVelocity2 = (m_verticalVelocity < 0.f ? -m_verticalVelocity : 0.f) * dt;
    bool has_hit = callback2.hasHit() && m_ghostObject->hasContactResponse() &&
                   needsCollision(m_ghostObject, callback2.m_hitCollisionObject);

    btScalar stepHeight = 0.0f;
    if (m_verticalVelocity < 0.0) {
      stepHeight = m_stepHeight;
    }

    if (downVelocity2 > 0.0 && downVelocity2 < stepHeight && has_hit && !runonce && (m_wasOnGround || !m_wasJumping)) {
      // redo the velocity calculation when falling a small amount, for fast stairs motion
      // for larger falls, use the smoother/slower interpolated movement by not touching the target position

      m_targetPosition = orig_position;
      downVelocity = stepHeight;

      step_drop = m_up * (m_currentStepOffset + downVelocity);
      m_targetPosition -= step_drop;
      runonce = true;
      continue; // re-run previous tests
    }
    break;
  }

  if ((m_ghostObject->hasContactResponse() && callback.hasHit() && needsCollision(m_ghostObject, callback.m_hitCollisionObject)) || runonce) {
    // we dropped a fraction of the height -> hit floor
    btScalar fraction = (m_currentPosition.getY() - callback.m_hitPointWorld.getY()) / 2.0;

    btScalar oldY = m_currentPosition.getY();
    m_currentPosition.setInterpolate3(m_currentPosition, m_targetPosition, callback.m_closestHitFraction);
    btScalar newY = m_currentPosition.getY();

    full_drop = false;

    m_verticalVelocity = 0.0;
    m_verticalOffset = 0.0;
    m_wasJumping = false;

    // Get the user data of the object we're now standing on
    floorUserIndex = callback.m_hitCollisionObject->getUserIndex();
  } else {
    // we dropped the full height
    full_drop = true;
    m_currentPosition = m_targetPosition;
  }
}

void
btKinematicCharacterController::setWalkDirection(const btVector3& walkDirection) {
  m_walkDirection = walkDirection;
  m_normalizedDirection = getNormalizedVector(m_walkDirection);
}

void
btKinematicCharacterController::warp(const btVector3& origin) {
  btTransform xform;
  xform.setIdentity();
  xform.setOrigin(origin);
  m_ghostObject->setWorldTransform(xform);
}

void
btKinematicCharacterController::preStep(btCollisionWorld* collisionWorld) {
  m_currentPosition = m_ghostObject->getWorldTransform().getOrigin();
  m_targetPosition = m_currentPosition;
}

void
btKinematicCharacterController::playerStep(btCollisionWorld* collisionWorld, btScalar dt) {
  m_wasOnGround = onGround();

  // Update fall velocity.
  m_verticalVelocity -= m_gravity * dt;
  if (m_verticalVelocity == 0.0) {
    // It can sometimes happen that the jump velocities and timesteps match up in such ways that
    // player vertical velocity comes out to exactly 0 at the apogee of the jump. This causes
    // the us to think that the player is on the ground at that point.
    //
    // So we prevent that by adding a tiny amount of downward velocity to the player in that case
    m_verticalVelocity = -0.0001;
  } else if (m_verticalVelocity > 0.0 && m_verticalVelocity > m_jumpSpeed) {
    m_verticalVelocity = m_jumpSpeed;
  } else if (m_verticalVelocity < 0.0 && btFabs(m_verticalVelocity) > btFabs(m_terminalVelocity)) {
    m_verticalVelocity = -btFabs(m_terminalVelocity);
  }
  m_verticalOffset = m_verticalVelocity * dt;

  btTransform xform = m_ghostObject->getWorldTransform();

  stepUp(collisionWorld);

  stepForwardAndStrafe(collisionWorld, m_walkDirection);

  stepDown(collisionWorld, dt);

  xform.setOrigin(m_currentPosition);
  m_ghostObject->setWorldTransform(xform);

  int numPenetrationLoops = 0;
  m_touchingContact = false;
  while (recoverFromPenetration(collisionWorld)) {
    numPenetrationLoops++;
    m_touchingContact = true;
    if (numPenetrationLoops > 8) {
      // printf("character could not recover from penetration in `stepDown` = %d\n", numPenetrationLoops);
      break;
    }
  }
}

void
btKinematicCharacterController::setFallSpeed(btScalar fallSpeed) {
  m_terminalVelocity = fallSpeed;
}

void
btKinematicCharacterController::setJumpSpeed(btScalar jumpSpeed) {
  m_jumpSpeed = jumpSpeed;
  m_SetjumpSpeed = m_jumpSpeed;
}

void
btKinematicCharacterController::jump(const btVector3& v) {
  m_jumpSpeed = v.length2() == 0 ? m_SetjumpSpeed : v.length();
  m_verticalVelocity = m_jumpSpeed;
  m_wasJumping = true;

  m_jumpAxis = v.length2() == 0 ? m_up : v.normalized();

  m_jumpPosition = m_ghostObject->getWorldTransform().getOrigin();
}

void
btKinematicCharacterController::setGravity(const btVector3& gravity) {
  if (gravity.length2() > 0) {
    setUpVector(-gravity);
  }

  m_gravity = gravity.length();
}

void
btKinematicCharacterController::setMaxSlope(btScalar slopeRadians) {
  m_maxSlopeRadians = slopeRadians;
  m_maxSlopeCosine = btCos(slopeRadians);
}

void
btKinematicCharacterController::setMaxPenetrationDepth(btScalar d) {
  m_maxPenetrationDepth = d;
}

bool
btKinematicCharacterController::onGround() const {
  return (fabs(m_verticalVelocity) < SIMD_EPSILON) && (fabs(m_verticalOffset) < SIMD_EPSILON);
}

void
btKinematicCharacterController::setStepHeight(btScalar h) {
  m_stepHeight = h;
}

void
btKinematicCharacterController::debugDraw(btIDebugDraw* debugDrawer) {}

void
btKinematicCharacterController::setUp(const btVector3& up) {
  if (up.length2() > 0 && m_gravity > 0.0f) {
    setGravity(-m_gravity * up.normalized());
    return;
  }

  setUpVector(up);
}

void
btKinematicCharacterController::setUpVector(const btVector3& up) {
  if (m_up == up) {
    return;
  }

  btVector3 u = m_up;

  if (up.length2() > 0) {
    m_up = up.normalized();
  } else {
    m_up = btVector3(0.0, 0.0, 0.0);
  }

  if (!m_ghostObject) {
    return;
  }
  btQuaternion rot = getRotation(m_up, u);

  // set orientation with new up
  btTransform xform;
  xform = m_ghostObject->getWorldTransform();
  btQuaternion orn = rot.inverse() * xform.getRotation();
  xform.setRotation(orn);
  m_ghostObject->setWorldTransform(xform);
}

btQuaternion
btKinematicCharacterController::getRotation(btVector3& v0, btVector3& v1) const {
  if (v0.length2() == 0.0f || v1.length2() == 0.0f) {
    btQuaternion q;
    return q;
  }

  return shortestArcQuatNormalize2(v0, v1);
}
