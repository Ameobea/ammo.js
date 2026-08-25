#ifndef BT_SURFACE_MATERIAL_H
#define BT_SURFACE_MATERIAL_H

#include "LinearMath/btVector3.h"

/// Per-surface physics material.  Registered on the character controller keyed by an
/// integer id chosen by the application; collision objects reference materials by id
/// (btCollisionObject::setSurfaceMaterialId).  Objects with no material (id -1) use the
/// controller's global config for everything.
struct btSurfaceMaterial {
  // Climbability overrides.  A negative angle/speed means "inherit the controller's global
  // setting".  Cosines are precomputed by the controller's setter for hot-path comparisons.
  btScalar m_maxClimbAngle = -1;
  btScalar m_maxClimbCos = 1;
  btScalar m_slideMinAngle = -1;
  btScalar m_slideMinCos = 1;
  btScalar m_slideMaxSpeed = -1;

  // Boost strip.  targetSpeed <= 0 means this surface is not a boost strip.
  btScalar m_boostTargetSpeed = 0;
  btScalar m_boostJumpRetention = 0;
  btScalar m_boostRampSeconds = 0;
  bool m_boostFollowSlope = true;

  // When set, replaces the controller's global external-velocity ground damping factor
  // while the player is grounded on this surface.
  bool m_hasExtVelGroundDamping = false;
  btVector3 m_extVelGroundDamping = btVector3(0, 0, 0);
};

#endif // BT_SURFACE_MATERIAL_H
