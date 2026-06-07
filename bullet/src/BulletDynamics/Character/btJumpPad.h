#ifndef BT_JUMP_PAD_H
#define BT_JUMP_PAD_H

#include "LinearMath/btVector3.h"

class btPairCachingGhostObject;

class btJumpPad {
public:
  btPairCachingGhostObject* m_ghostObject;
  btVector3 m_direction;
  btScalar m_baseImpulse;
  btScalar m_speedScaling;
  btScalar m_cooldownSeconds;
  btScalar m_lastTriggerTime;
  int m_zoneId;
  bool m_isOverlapping;
  bool m_enabled;
  bool m_useExternalVelocity;

  btJumpPad(
    btPairCachingGhostObject* ghostObject,
    int zoneId,
    btScalar baseImpulse,
    btScalar speedScaling,
    btScalar cooldownSeconds
  )
    : m_ghostObject(ghostObject)
    , m_direction(0, 1, 0)
    , m_baseImpulse(baseImpulse)
    , m_speedScaling(speedScaling)
    , m_cooldownSeconds(cooldownSeconds)
    , m_lastTriggerTime(-1000)
    , m_zoneId(zoneId)
    , m_isOverlapping(false)
    , m_enabled(true)
    , m_useExternalVelocity(false) {}

  void setDirection(const btVector3& direction) {
    m_direction = direction.normalized();
  }

  void setBaseImpulse(btScalar impulse) {
    m_baseImpulse = impulse;
  }

  void setSpeedScaling(btScalar scaling) {
    m_speedScaling = scaling;
  }

  void setCooldownSeconds(btScalar seconds) {
    m_cooldownSeconds = seconds;
  }

  int getZoneId() const {
    return m_zoneId;
  }

  void setEnabled(bool enabled) {
    m_enabled = enabled;
  }

  void setUseExternalVelocity(bool useExternal) {
    m_useExternalVelocity = useExternal;
  }
};

#endif // BT_JUMP_PAD_H
