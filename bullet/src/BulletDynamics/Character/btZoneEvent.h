#ifndef BT_ZONE_EVENT_H
#define BT_ZONE_EVENT_H

enum btZoneEventType {
  ZONE_EVENT_SENSOR_ENTER = 0,
  ZONE_EVENT_SENSOR_LEAVE = 1,
  ZONE_EVENT_JUMP_PAD_TRIGGERED = 2,
  ZONE_EVENT_BOOST_ZONE_ENTER = 3,
  ZONE_EVENT_BOOST_ZONE_EXIT = 4,
};

struct btZoneEvent {
  int m_zoneId;
  int m_eventType;
};

#endif // BT_ZONE_EVENT_H
