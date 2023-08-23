build:
  cmake -B builds -DCLOSURE=0   -DALLOW_MEMORY_GROWTH=1
  cd builds && make -j16
  echo "export {Ammo};" >> builds/ammo.wasm.js
