const fs = require('fs');
const filepath = 'src/components/AdminPanelUI.js';
let code = fs.readFileSync(filepath, 'utf8');

const replacement = `                              onClick={() => {
                                game?.teleportToCell(x, y);
                                setMinimapData(game.getMinimapData());
                                if (onClose) onClose();
                              }}`;

code = code.replace(`                              onClick={() => {
                                game?.teleportToCell(x, y);
                                setMinimapData(game.getMinimapData());
                              }}`, replacement);

fs.writeFileSync(filepath, code);
console.log('Patched AdminPanelUI.js');
