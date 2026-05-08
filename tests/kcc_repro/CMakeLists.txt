cmake_minimum_required(VERSION 3.13)
set(CMAKE_POLICY_DEFAULT_CMP0077 NEW)

project(kcc_repro CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

# Match ammo.js root: keep bullet's optional graphical/demo bits out.
set(USE_GLUT OFF CACHE BOOL "" FORCE)
set(USE_GRAPHICAL_BENCHMARK OFF CACHE BOOL "" FORCE)
set(BUILD_DEMOS OFF CACHE BOOL "" FORCE)
set(BUILD_CPU_DEMOS OFF CACHE BOOL "" FORCE)
set(BUILD_EXTRAS OFF CACHE BOOL "" FORCE)
set(BUILD_UNIT_TESTS OFF CACHE BOOL "" FORCE)
set(BUILD_MULTITHREADING OFF CACHE BOOL "" FORCE)
set(INSTALL_LIBS OFF CACHE BOOL "" FORCE)

# Pull in bullet's libraries (BulletDynamics, BulletCollision, LinearMath, BulletSoftBody).
# EXCLUDE_FROM_ALL keeps it from auto-building extras unless our targets pull them in.
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../../bullet bullet_build EXCLUDE_FROM_ALL)

add_executable(kcc_repro main.cpp)

target_include_directories(kcc_repro PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/../../bullet/src
)

target_link_libraries(kcc_repro PRIVATE
  BulletDynamics
  BulletCollision
  LinearMath
)
