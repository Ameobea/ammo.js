#ifndef BT_BOOST_ZONE_H
#define BT_BOOST_ZONE_H

#include "LinearMath/btVector3.h"

class btPairCachingGhostObject;

class btBoostZone {
public:
  btPairCachingGhostObject* m_ghostObject;
  btVector3 m_direction;
  btScalar m_strength;
  btScalar m_directionalBias;
  int m_zoneId;
  bool m_isOverlapping;
  bool m_enabled;

  btBoostZone(
    btPairCachingGhostObject* ghostObject,
    int zoneId,
    btScalar strength,
    btScalar directionalBias
  )
    : m_ghostObject(ghostObject)
    , m_direction(0, 1, 0)
    , m_strength(strength)
    , m_directionalBias(directionalBias)
    , m_zoneId(zoneId)
    , m_isOverlapping(false)
    , m_enabled(true) {}

  void setDirection(const btVector3& direction) {
    m_direction = direction.normalized();
  }

  void setStrength(btScalar strength) {
    m_strength = strength;
  }

  void setDirectionalBias(btScalar bias) {
    m_directionalBias = bias;
  }

  int getZoneId() const {
    return m_zoneId;
  }

  void setEnabled(bool enabled) {
    m_enabled = enabled;
  }
};

#endif // BT_BOOST_ZONE_H
