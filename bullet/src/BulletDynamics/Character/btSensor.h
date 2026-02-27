#ifndef BT_SENSOR_H
#define BT_SENSOR_H

#include "LinearMath/btScalar.h"

class btPairCachingGhostObject;

class btSensor {
public:
  btPairCachingGhostObject* m_ghostObject;
  int m_zoneId;
  btScalar m_minPenetrationDepth;
  bool m_isOverlapping;
  bool m_enabled;

  btSensor(
    btPairCachingGhostObject* ghostObject,
    int zoneId,
    btScalar minPenetrationDepth
  )
    : m_ghostObject(ghostObject)
    , m_zoneId(zoneId)
    , m_minPenetrationDepth(minPenetrationDepth)
    , m_isOverlapping(false)
    , m_enabled(true) {}

  void setEnabled(bool enabled) {
    m_enabled = enabled;
  }

  int getZoneId() const {
    return m_zoneId;
  }

  bool isOverlapping() const {
    return m_isOverlapping;
  }
};

#endif // BT_SENSOR_H
