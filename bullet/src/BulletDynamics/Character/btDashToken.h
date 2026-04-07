#ifndef BT_DASH_TOKEN_H
#define BT_DASH_TOKEN_H

#include "LinearMath/btScalar.h"

class btPairCachingGhostObject;

class btDashToken {
public:
  btPairCachingGhostObject* m_ghostObject;
  int m_zoneId;
  int m_chargesGranted;
  btScalar m_minPenetrationDepth;
  bool m_isOverlapping;
  bool m_enabled;
  bool m_active;
  bool m_checkpointActive;
  bool m_initialActive;

  btDashToken(
    btPairCachingGhostObject* ghostObject,
    int zoneId,
    int chargesGranted,
    btScalar minPenetrationDepth
  )
    : m_ghostObject(ghostObject)
    , m_zoneId(zoneId)
    , m_chargesGranted(chargesGranted)
    , m_minPenetrationDepth(minPenetrationDepth)
    , m_isOverlapping(false)
    , m_enabled(true)
    , m_active(true)
    , m_checkpointActive(true)
    , m_initialActive(true) {}

  void setEnabled(bool enabled) {
    m_enabled = enabled;
  }

  int getZoneId() const {
    return m_zoneId;
  }

  void setChargesGranted(int chargesGranted) {
    m_chargesGranted = chargesGranted;
  }

  int getChargesGranted() const {
    return m_chargesGranted;
  }

  void setActive(bool active) {
    m_active = active;
    if (active) {
      m_isOverlapping = false;
    }
  }

  bool isActive() const {
    return m_active;
  }
};

#endif // BT_DASH_TOKEN_H
