/*
Bullet Continuous Collision Detection and Physics Library
Copyright (c) 2003-2008 Erwin Coumans  http://bulletphysics.com

This software is provided 'as-is', without any express or implied warranty.
In no event will the authors be held liable for any damages arising from the use of this software.
Permission is granted to anyone to use this software for any purpose, 
including commercial applications, and to alter it and redistribute it freely, 
subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim that you wrote the original software. If you use this software in a product, an acknowledgment in the product documentation would be appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
*/

#ifndef BT_KINEMATIC_CHARACTER_CONTROLLER_H
#define BT_KINEMATIC_CHARACTER_CONTROLLER_H

#include "LinearMath/btVector3.h"

#include "btCharacterControllerInterface.h"

#include "BulletCollision/BroadphaseCollision/btCollisionAlgorithm.h"

class btCollisionShape;
class btConvexShape;
class btRigidBody;
class btCollisionWorld;
class btCollisionDispatcher;
class btPairCachingGhostObject;

///btKinematicCharacterController is an object that supports a sliding motion in a world.
///It uses a ghost object and convex sweep test to test for upcoming collisions. This is combined with discrete collision detection to recover from penetrations.
///Interaction between btKinematicCharacterController and dynamic rigid bodies needs to be explicity implemented by the user.
ATTRIBUTE_ALIGNED16(class)
btKinematicCharacterController : public btCharacterControllerInterface
{
protected:
	btScalar m_halfHeight;

	btPairCachingGhostObject* m_ghostObject;
	btConvexShape* m_convexShape;  //is also in m_ghostObject, but it needs to be convex, so we store it here to avoid upcast

	btScalar m_maxPenetrationDepth;
	btScalar m_verticalVelocity;
	btScalar m_verticalOffset;
	btScalar m_terminalVelocity;
	btScalar m_jumpSpeed;
	btScalar m_SetjumpSpeed;
	btScalar m_maxSlopeRadians;  // Slope angle that is set (used for returning the exact value)
	btScalar m_maxSlopeCosine;   // Cosine equivalent of m_maxSlopeRadians (calculated once when set, for optimization)
	btScalar m_gravity;

	btScalar m_turnAngle;

	btScalar m_stepHeight;

	btScalar m_addedMargin;  //@todo: remove this and fix the code

	///this is the desired walk direction, set by the user
	btVector3 m_walkDirection;
	btVector3 m_normalizedDirection;
	btVector3 m_AngVel;

	btVector3 m_jumpPosition;

	// some internal variables
	btVector3 m_currentPosition;
	btScalar m_currentStepOffset;
	btVector3 m_targetPosition;

	/// keep track of the contact manifolds
	btManifoldArray m_manifoldArray;

	bool m_touchingContact;
	btVector3 m_touchingNormal;

	bool m_wasOnGround;
	bool m_wasJumping;
	btScalar m_velocityTimeInterval;
	btVector3 m_up;
	btVector3 m_jumpAxis;

	/// If we know nothing in the world is going to move around except the player,
	/// we can fast-path some checks.
	bool worldIsStatic = true;

	/// Stores the `userIndex` of the collision object that the player is standing on.
	///
	/// If `onGround()` is not true, then this is the index of the last object that the player was standing on.
	///
	/// Defaults to -1 if the player has never been on the ground.
	int floorUserIndex = -1;

	bool full_drop;

	btVector3 computeReflectionDirection(const btVector3& direction, const btVector3& normal);
	btVector3 parallelComponent(const btVector3& direction, const btVector3& normal);
	btVector3 perpindicularComponent(const btVector3& direction, const btVector3& normal);

	bool recoverFromPenetration(btCollisionWorld * collisionWorld);
	void stepUp(btCollisionWorld * collisionWorld);
	void updateTargetPositionBasedOnCollision(const btVector3& hit_normal, btScalar tangentMag = btScalar(0.0), btScalar normalMag = btScalar(1.0));
	void stepForwardAndStrafe(btCollisionWorld * collisionWorld, const btVector3& walkMove);
	void stepDown(btCollisionWorld * collisionWorld, btScalar dt);

	virtual bool needsCollision(const btCollisionObject* body0, const btCollisionObject* body1);

	void setUpVector(const btVector3& up);

	btQuaternion getRotation(btVector3 & v0, btVector3 & v1) const;

public:
	BT_DECLARE_ALIGNED_ALLOCATOR();

	btKinematicCharacterController(btPairCachingGhostObject * ghostObject, btConvexShape * convexShape, btScalar stepHeight, const btVector3& up = btVector3(1.0, 0.0, 0.0));
	~btKinematicCharacterController();

	///btActionInterface interface
	virtual void updateAction(btCollisionWorld * collisionWorld, btScalar deltaTime) {
		preStep(collisionWorld);
		playerStep(collisionWorld, deltaTime);
	}

	/// btActionInterface interface
	void debugDraw(btIDebugDraw * debugDrawer);

	void setUp(const btVector3& up);

	const btVector3& getUp() { return m_up; }

	/// This should probably be called setPositionIncrementPerSimulatorStep.
	/// This is neither a direction nor a velocity, but the amount to
	///	increment the position each simulation iteration, regardless
	///	of dt.
	virtual void setWalkDirection(const btVector3& walkDirection);

	void warp(const btVector3& origin);

	void preStep(btCollisionWorld * collisionWorld);
	void playerStep(btCollisionWorld * collisionWorld, btScalar dt);

	void setStepHeight(btScalar h);
	void setFallSpeed(btScalar fallSpeed);
	void setJumpSpeed(btScalar jumpSpeed);

	void jump(const btVector3& v = btVector3(0, 0, 0));

	void applyImpulse(const btVector3& v) { jump(v); }

	void setGravity(const btVector3& gravity);

	/// The max slope determines the maximum angle that the controller can walk up.
	/// The slope angle is measured in radians.
	void setMaxSlope(btScalar slopeRadians);

	void setMaxPenetrationDepth(btScalar d);

	bool onGround() const;

	btScalar getVerticalVelocity() const { return m_verticalVelocity; }

	bool isJumping() const { return m_wasJumping; }

	int getFloorUserIndex() const { return floorUserIndex; }
};

#endif  // BT_KINEMATIC_CHARACTER_CONTROLLER_H
