const fs = require('fs');
const filepath = 'src/components/game/Maze3D.js';
let code = fs.readFileSync(filepath, 'utf8');

// When admin closes, we request pointer lock again in AdminPanelUI, wait, actually let's just make the pause un-pause cleanly.
code = code.replace(
`      if (!isPaused) {
        setTimeout(() => {
          if (!document.pointerLockElement && gameRef.current) {
            gameRef.current.requestPointerLock();
          }
        }, 300);
      }`,
`      if (!isPaused) {
        setTimeout(() => {
          if (!document.pointerLockElement && gameRef.current) {
            gameRef.current.requestPointerLock();
          }
        }, 100); // Shorter timeout might be better
      }`);

fs.writeFileSync(filepath, code);
console.log('Patched Maze3D.js');
