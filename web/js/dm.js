const mapWrapper = document.getElementById('map-wrapper');
const fogCanvas = document.getElementById('fog-of-war');
const ctx = fogCanvas.getContext('2d');
const mapContainer = document.getElementById('map-container');
const fileInput = document.getElementById('file-input');
const dragDropArea = document.getElementById('drag-drop-area');
const fileLabel = document.getElementById('file-label');
const resetFogBtn = document.getElementById('reset-fog');
const openPlayersBtn = document.getElementById('open-players');
const tokenColorInput = document.getElementById('token-color');
const tokenImageInput = document.getElementById('token-image');
const tokenLabelInput = document.getElementById('token-text');
const brushSizeControl = document.getElementById('brush-size-control');
const tokenCustomization = document.getElementById('token-customization');

const brushSizeSlider = document.getElementById('brush-size-slider');
const brushSizeInput = document.getElementById('brush-size-input');
brushSizeSlider.addEventListener('input', () => {
	brushSizeInput.value = brushSizeSlider.value;
});

brushSizeInput.addEventListener('input', () => {
	brushSizeSlider.value = brushSizeInput.value;
});

const mapScale = document.getElementById('map-scale');
mapScale.addEventListener("change", () => {
	const oldScale = scale;
	scale = parseInt(mapScale.value, 10) / 100;
	zoom(oldScale, self.innerWidth/2, self.innerHeight/2)
})

const oriX = document.getElementById('originX');
const oriY = document.getElementById('originY');
oriX.addEventListener("change", () => {
	originX = parseInt(oriX.value)
})
oriY.addEventListener("change", () => {
	originY = parseInt(oriY.value)
})

const fogToolRadio = document.getElementById('fog-tool');
const tokenToolRadio = document.getElementById('token-tool');
fogToolRadio.addEventListener('change', updateToolDisplay);
tokenToolRadio.addEventListener('change', updateToolDisplay);
updateToolDisplay();

let scale = 1; // Początkowa skala
let originX = 0; // Początkowe przesunięcie X
let originY = 0; // Początkowe przesunięcie Y
let isDragging = false;
let isErasing = false;
let isDrawing = false;
let draggedToken = false;
let startX, startY;
let fog_color = "#111";
let clickStartX, clickStartY;
// Historia zmian
const undoStack = [];
const maxUndoSteps = 50; // Maksymalna liczba kroków cofania

// Obsługa przeciągnij i upuść
mapContainer.addEventListener('dragover', (event) => {
	event.preventDefault();
	dragDropArea.style.display = 'flex';
});

mapContainer.addEventListener('dragenter', (event) => {
	event.preventDefault();
});

dragDropArea.addEventListener('dragleave', (event) => {
	dragDropArea.style.display = 'none';
});

dragDropArea.addEventListener('drop', (event) => {
	event.preventDefault();
	dragDropArea.style.display = 'none';
	
	var files = event.dataTransfer.files;
	
	if (files.length > 0) {
		fileInput.files = files;
		handleFile(event.dataTransfer.files[0]);
	}
});

document.addEventListener('contextmenu', event => event.preventDefault());

// Obsługa zoomowania
mapContainer.addEventListener('wheel', function(event) {
	event.preventDefault();
	const oldScale = scale;
	
	const scaleFactor = event.deltaY < 0 ? 1.1 : 0.9;
    scale *= scaleFactor;

	zoom(oldScale, event.clientX, event.clientY)
	mapScale.value = parseInt(scale*100)
	saveInputsState()
});

// Obsługa przesuwania mapy (dragging)
mapContainer.addEventListener('mousedown', function(event) {
	if (event.button === 1) { // Środkowy przycisk myszy
		isDragging = true;
		mapContainer.style.cursor = 'move';
		startX = event.clientX - originX;
		startY = event.clientY - originY;
	} else if (event.button === 0) { // Lewy przycisk myszy
		if (fogToolRadio.checked) {
			isErasing = true;
			saveState(); // Zapisz stan przed usunięciem mgły
			eraseFog(event); // Usuwanie mgły w miejscu kliknięcia
		}
	} else if (event.button === 2) { // Prawy przycisk myszy
		if (fogToolRadio.checked) {
			isDrawing = true;
			saveState(); // Zapisz stan przed dodaniem mgły
			settings(event); // Dodanie mgły w miejscu kliknięcia
		}
	}
});

window.addEventListener('mousemove', function(event) {
	if (isDragging) {
		originX = event.clientX - startX;
		originY = event.clientY - startY;
		mapWrapper.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
		oriX.value = originX;
		oriY.value = originY;
		saveInputsState()
	} else if (isErasing) {
		eraseFog(event); // Usuwanie mgły podczas ruchu myszy
	} else if (isDrawing) {
		drawFog(event); // Dodawanie mgły podczas ruchu myszy
	}
	if (draggedToken) {
        const rect = mapWrapper.getBoundingClientRect();
        const x = (event.clientX - rect.left) / scale - draggedToken.offsetWidth / 2;
        const y = (event.clientY - rect.top) / scale - draggedToken.offsetHeight / 2;

        draggedToken.style.left = `${x}px`;
        draggedToken.style.top = `${y}px`;
    }
});

window.addEventListener('mouseup', function() {
	isDragging = false;
	if (isErasing) {saveFogState();}
	isErasing = false;
	if (isDrawing) {saveFogState();}
	isDrawing = false;
	mapContainer.style.cursor = '';
	if (draggedToken) {
        draggedToken = false; // Zresetowanie przeciąganego tokenu po upuszczeniu
        return; // Przerwij, aby zapobiec tworzeniu nowego tokenu
    }
	
	if (event.button === 0) { // Lewy przycisk myszy
		const clickEndX = event.clientX;
		const clickEndY = event.clientY;
		
		// Sprawdzenie, czy współrzędne wciśnięcia i upuszczenia są blisko siebie (czyli uznawane za kliknięcie)
		const threshold = 5; // Tolerancja w pikselach
		if (Math.abs(clickStartX - clickEndX) <= threshold && Math.abs(clickStartY - clickEndY) <= threshold && tokenToolRadio.checked && !event.target.classList.contains('token') && !event.target.classList.contains('token-label')) {
			const rect = mapWrapper.getBoundingClientRect();
			const x = (event.clientX - rect.left) / scale;
			const y = (event.clientY - rect.top) / scale;
			createToken(x, y, parseInt(document.getElementById('token-size-input').value), document.getElementById('token-color').value, tokenCounter++);
		}
	}
	if (draggedToken) {
        draggedToken = null; // Zresetowanie przeciąganego tokenu po upuszczeniu
    }
});

// Obsługa cofania (Ctrl+Z)
window.addEventListener('keydown', function(event) {
	if (event.ctrlKey && event.key === 'z') {
		undo();
	}
});

mapWrapper.addEventListener('mousedown', function(event) {
	if (event.button === 0) { // Lewy przycisk myszy
		clickStartX = event.clientX;
		clickStartY = event.clientY;
	}
});

fileInput.addEventListener('change', (event) => {
	if (event.target.files.length > 0) {
		handleFile(event.target.files[0]);
	}
});

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', saveInputsState);
    input.addEventListener('change', saveInputsState);
});

resetFogBtn.addEventListener("click", () => {
	fogCanvas.width = mapWrapper.clientWidth;
	fogCanvas.height = mapWrapper.clientHeight;
	ctx.fillStyle = fog_color;
	ctx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
	saveFogState()
})

openPlayersBtn.addEventListener("click", () => {
	eel.open_players();
})

let initialDistance = 0;
let initialScale = scale;
// Obsługa gestów na urządzeniach mobilnych
mapContainer.addEventListener('touchstart', function(event) {
    if (event.touches.length === 1) {
        // Przeciąganie
        isDragging = true;
        startX = event.touches[0].clientX - originX;
        startY = event.touches[0].clientY - originY;
    } else if (event.touches.length === 2) {
        // Zoomowanie (pinch-to-zoom)
        isDragging = false; // Wstrzymaj przeciąganie
        initialDistance = getDistance(event.touches);
        initialScale = scale;
    }
});

mapContainer.addEventListener('touchmove', function(event) {
    if (event.touches.length === 1 && isDragging) {
        // Przeciąganie
        originX = event.touches[0].clientX - startX;
        originY = event.touches[0].clientY - startY;
        mapWrapper.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
        oriX.value = originX;
        oriY.value = originY;
    } else if (event.touches.length === 2) {
        // Zoomowanie (pinch-to-zoom)
        const currentDistance = getDistance(event.touches);
        const scaleFactor = currentDistance / initialDistance;
        scale = initialScale * scaleFactor;
        zoom(initialScale, (event.touches[0].clientX + event.touches[1].clientX) / 2, 
             (event.touches[0].clientY + event.touches[1].clientY) / 2);
        mapScale.value = parseInt(scale * 100);
    }
});

mapContainer.addEventListener('touchend', function(event) {
    isDragging = false;
});

// Funkcja do obliczania odległości między dwoma punktami dotyku
function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function handleFile(file) {
	const reader = new FileReader();
	reader.onload = function(event) {
		let mapImg = document.getElementById('map');

		if (!mapImg) {
			// Jeśli mapImg nie istnieje, stwórz nowy element img
			mapImg = document.createElement('img');
			mapImg.id = 'map';
			mapImg.src = event.target.result;

			// Dodaj nowo stworzony element img jako pierwszy element w mapWrapper
			mapWrapper.insertBefore(mapImg, mapWrapper.firstChild);
		} else {
			mapImg.src = event.target.result;
		}

		mapImg.onload = function() {
			saveMapState(event.target.result);
			
			fogCanvas.width = mapWrapper.clientWidth;
			fogCanvas.height = mapWrapper.clientHeight;
			ctx.fillStyle = fog_color;
			ctx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
		};
				
		
	};
	reader.readAsDataURL(file);
}

// zoom
function zoom(oldScale, centerX, centerY) {
	const offsetX = (centerX - originX) / oldScale;
    const offsetY = (centerY - originY) / oldScale;

    const newOffsetX = offsetX * scale;
    const newOffsetY = offsetY * scale;

    originX += centerX - (originX + newOffsetX);
    originY += centerY - (originY + newOffsetY);

	mapWrapper.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}

// Funkcja przełączania widoczności
function updateToolDisplay() {
    if (fogToolRadio.checked) {
        brushSizeControl.classList.remove('hidden');
        tokenCustomization.classList.add('hidden');
    } else if (tokenToolRadio.checked) {
        brushSizeControl.classList.add('hidden');
        tokenCustomization.classList.remove('hidden');
    }
}

// Funkcja zapisu stanu mapy
function saveMapState(mapData) {
	eel.save_map_state(mapData);
}

function saveState() {
	// Zapisuje aktualny stan mgły na stosie cofania
	if (undoStack.length >= maxUndoSteps) {
		undoStack.shift(); // Usuwa najstarszy stan, jeśli przekroczono limit
	}
	undoStack.push(ctx.getImageData(0, 0, fogCanvas.width, fogCanvas.height));

	// Zapis stanu mgły w pliku
	saveFogState();
}

function undo() {
	if (undoStack.length > 0) {
		const lastState = undoStack.pop();
		ctx.putImageData(lastState, 0, 0);

		// Zapis stanu mgły w pliku po cofnięciu
		saveFogState();
	}
}

function eraseFog(event) {
	const rect = mapWrapper.getBoundingClientRect();
	const x = (event.clientX - rect.left) / scale;
	const y = (event.clientY - rect.top) / scale;
	const radius = parseInt(brushSizeInput.value, 10);

	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.save();
	ctx.clip();
	ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2);
	ctx.restore();
}

function drawFog(event) {
	const rect = mapWrapper.getBoundingClientRect();
	const x = (event.clientX - rect.left) / scale;
	const y = (event.clientY - rect.top) / scale;
	const radius = parseInt(brushSizeInput.value, 10);

	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2, true);
	ctx.fillStyle = fog_color;
	ctx.fill();
	ctx.closePath();
}

// Zapis stanu mgły do pliku
function saveFogState() {
	const fogData = fogCanvas.toDataURL();
	eel.save_fog_state(fogData);
}

let tokenCounter = 1; // Zmienna do śledzenia numeru tokenu
function createToken(x, y, size, color, text) {
    // Pobranie koloru i rozmiaru z inputów
    // const color = document.getElementById('token-color').value;
    // const size = document.getElementById('token-size-input').value;
    // const rect = mapWrapper.getBoundingClientRect();
    // const x = (event.clientX - rect.left) / scale - size/2;
    // const y = (event.clientY - rect.top) / scale - size/2;

    const token = document.createElement('div');
    token.className = 'token';
    token.style.left = `${x - size/2}px`;
    token.style.top = `${y - size/2}px`;
    token.style.width = `${size}px`;
    token.style.height = `${size}px`;
    token.style.backgroundColor = color;
    token.style.lineHeight = `${size/2}px`; // Centrowanie tekstu w pionie
    token.style.fontSize = `${size / 2.5}px`; // Proporcjonalny rozmiar tekstu

    // Dodanie numeru do tokenu
    const tokenLabel = document.createElement('div');
    tokenLabel.contentEditable = true; // Umożliwienie edycji tekstu
    tokenLabel.textContent = text;
    tokenLabel.style.cursor = 'text';
	tokenLabel.classList.add("token-label")
	tokenLabel.spellcheck = false;
    token.appendChild(tokenLabel);

    // Usuwanie żetonu po kliknięciu prawym przyciskiem myszy
    token.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        token.remove();
		saveTokensState()
    });

    // Zapobieganie tworzeniu nowego tokenu przy kliknięciu na istniejący
    token.addEventListener('mousedown', function(event) {
        event.stopPropagation(); // Zatrzymanie propagacji zdarzenia
        if (event.button === 0) { // Lewy przycisk myszy
            draggedToken = token; // Ustawienie przeciąganego tokenu
            clickStartX = event.clientX;
            clickStartY = event.clientY;
			event.stopPropagation();
        }
    });

	token.addEventListener('mouseup', function(event) {
        if (event.button === 0) { // Lewy przycisk myszy
            // Sprawdzenie, czy wciśnięcie i upuszczenie były blisko siebie
            const clickEndX = event.clientX;
            const clickEndY = event.clientY;
            const threshold = 5; // Tolerancja w pikselach
            if (Math.abs(clickStartX - clickEndX) <= threshold && Math.abs(clickStartY - clickEndY) <= threshold && !event.target.classList.contains('token-label')) {
                // Zmiana koloru tokenu na losowy
                token.style.backgroundColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
				saveTokensState()
            }
            draggedToken = null; // Zresetowanie przeciąganego tokenu
        }
    });

    // Obsługa zmiany tekstu w tokenie
    tokenLabel.addEventListener('input', function(event) {
        console.log(`Token text changed to: ${tokenLabel.textContent}`);
		saveTokensState()
    });

    mapWrapper.appendChild(token);
	saveTokensState()
}

function saveTokensState() {
    const tokens = [];
    
    document.querySelectorAll('.token').forEach(token => {
        const tokenData = {
            left: parseInt(token.style.left),
            top: parseInt(token.style.top),
            size: parseInt(token.style.width),
            color: token.style.backgroundColor,
            text: token.querySelector('div').textContent
        };
        tokens.push(tokenData);
    });

    // Przesyłanie danych do Pythona
    eel.save_tokens_state(tokens);
}

function saveInputsState() {
    const inputsData = {};

    document.querySelectorAll('input').forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
            inputsData[input.id] = input.checked;
        } else {
            inputsData[input.id] = input.value;
        }
    });

    // Przesyłanie danych do Pythona
    eel.save_inputs_state(inputsData);
}

// Ładowanie zapisanego stanu mapy i mgły przy starcie
window.onload = function() {
	eel.load_saved_state()(function(savedState) {
		if (savedState.map) {
			let mapImg = document.getElementById('map');

			if (!mapImg) {
				// Jeśli mapImg nie istnieje, stwórz nowy element img
				mapImg = document.createElement('img');
				mapImg.id = 'map';
				mapImg.src = savedState.map;

				// Dodaj nowo stworzony element img jako pierwszy element w mapWrapper
				mapWrapper.insertBefore(mapImg, mapWrapper.firstChild);
			}
			
			mapImg.onload = function() {
				fogCanvas.width = mapWrapper.clientWidth;
				fogCanvas.height = mapWrapper.clientHeight;
				if (savedState.fog) {
					const img = new Image();
					img.src = savedState.fog;
					img.onload = function() {
						ctx.drawImage(img, 0, 0);
					};
				} else {
					ctx.fillStyle = fog_color;
					ctx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);
				}

				if (savedState.tokens) {
					savedState.tokens.forEach(tokenData => {
						createToken(tokenData.left, tokenData.top, tokenData.size, tokenData.color, tokenData.text);
					});
				}
			};
		}
		if (savedState.settings) {
			for (const id in savedState.settings) {
				const input = document.getElementById(id);
				if (input) {
					if (input.type === 'radio' || input.type === 'checkbox') {
						input.checked = savedState.settings[id];
					} else {
						input.value = savedState.settings[id];
					}
				}
			}
			updateToolDisplay();
			originX = parseInt(oriX.value);
			originY = parseInt(oriY.value);
			scale = parseInt(mapScale.value)/100;
			mapWrapper.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
		}
	});
};

