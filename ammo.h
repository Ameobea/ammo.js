#include "BulletCollision/CollisionDispatch/btGhostObject.h"
#include "BulletCollision/CollisionDispatch/btInternalEdgeUtility.h"
#include "BulletCollision/CollisionShapes/btConvexPolyhedron.h"
#include "BulletCollision/CollisionShapes/btHeightfieldTerrainShape.h"
#include "BulletCollision/CollisionShapes/btShapeHull.h"
#include "BulletCollision/CollisionShapes/btTriangleInfoMap.h"
#include "BulletCollision/Gimpact/btGImpactCollisionAlgorithm.h"
#include "BulletCollision/Gimpact/btGImpactShape.h"
#include "BulletDynamics/Character/btKinematicCharacterController.h"
#include "BulletSoftBody/btDefaultSoftBodySolver.h"
#include "BulletSoftBody/btSoftBody.h"
#include "BulletSoftBody/btSoftBodyHelpers.h"
#include "BulletSoftBody/btSoftBodyRigidBodyCollisionConfiguration.h"
#include "BulletSoftBody/btSoftRigidDynamicsWorld.h"
#include "btBulletDynamicsCommon.h"

//Web IDL doesn't seem to support C++ templates so this is the best we can do
//https://stackoverflow.com/questions/42517010/is-there-a-way-to-create-webidl-bindings-for-c-templated-types#comment82966925_42517010
typedef btAlignedObjectArray<btVector3> btVector3Array;
typedef btAlignedObjectArray<btFace> btFaceArray;
typedef btAlignedObjectArray<int> btIntArray;
typedef btAlignedObjectArray<btIndexedMesh> btIndexedMeshArray;
typedef btAlignedObjectArray<const btCollisionObject*> btConstCollisionObjectArray;
typedef btAlignedObjectArray<btScalar> btScalarArray;

// Wrapper for btTriangleIndexVertexArray that accepts void* pointers,
// since Emscripten's WebIDL binder lacks raw pointer support for primitive types.
class btTriangleIndexVertexArrayWrapper : public btTriangleIndexVertexArray {
public:
  btTriangleIndexVertexArrayWrapper(
    int numTriangles,
    void* triangleIndexBase,
    int triangleIndexStride,
    int numVertices,
    void* vertexBase,
    int vertexStride
  )
    : btTriangleIndexVertexArray(
        numTriangles,
        static_cast<int*>(triangleIndexBase),
        triangleIndexStride,
        numVertices,
        static_cast<btScalar*>(vertexBase),
        vertexStride
      ) {}
};
