const canvas = document.getElementById('canvas') // get canvas element for drawing
const ctx = canvas.getContext('2d') // the 2d rendring for canvas
const canvasWidth = 2000 //canvas width
const canvasHeight = 2000 // height of canvas
canvas.width = canvasWidth // Set the canvas width
canvas.height = canvasHeight // Set the canvas height
let isTouchScreen = false;

const eatSound = new Audio('eat.mp3'); 
const backgroundMusic = new Audio('background_music.mp3'); 
backgroundMusic.loop = true 
let loopInterval = 50; // interval for game loop which control game speed
let gamePaused = false;
const notice = document.getElementById('notice');
const textarea = document.getElementById('textarea');

//pause button
const pauseResumeButton = document.getElementById('pauseResumeButton');
pauseResumeButton.addEventListener('click', () => {
    if (gamePaused) {
        resumeGame()
    } else {
        pauseGame()
    }
});


const controlModal = document.getElementById('controlModal');
const pcControlButton = document.getElementById('pcControlButton');
const touchControlButton = document.getElementById('touchControlButton');
const touchControls = document.getElementById('touchControls');



let score = 0; // initial player score
let highScore = localStorage.getItem('highScore') || 0; // get heighest score
const scoreElement = document.getElementById('score'); //  the score element
const highScoreElement = document.getElementById('highScore'); // get the high score element
highScoreElement.textContent = highScore; // display the high score

const startButton = document.getElementById('startButton'); //  the start button element
let gameRunning = false;
const strawberryImg = new Image()
strawberryImg.src = 'srawberry.png'

const cherryImg = new Image()
cherryImg.src = 'cherry.png'

const rockImgone = new Image()
rockImgone.src = 'rock1.png'

const rockImgtwo = new Image()
rockImgtwo.src = 'rock2.png'

startButton.addEventListener('click', startGame);

function playGameMusic() {
    backgroundMusic.play();
}

//rock class
class Rock {
    constructor(image) {
        this.image = image;
        this.size = 130; 
        this.position = this.randomPosition()
    }

    // random position for rock
    randomPosition() {
        return {
            x: Math.floor(Math.random() * canvas.width / this.size) * this.size,
            y: Math.floor(Math.random() * canvas.height / this.size) * this.size,
        };
    }

    // draw rock on the canvas
    draw() {
        ctx.drawImage(this.image, this.position.x, this.position.y, this.size, this.size);
    }
}

// food class
class Food {
    constructor(image) {
        this.image = image;
        this.size = 40; 

        this.position = this.randomPosition(); 
    }

    // random position for the food
    randomPosition() {
        return {
            x: Math.floor(Math.random() * canvas.width / this.size) * this.size,
            y: Math.floor(Math.random() * canvas.height / this.size) * this.size,
        };
    }

    // draw food on the canvas
    draw() {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 5
        ctx.shadowOffsetY = 5
        ctx.drawImage(this.image, this.position.x, this.position.y, this.size, this.size);
        ctx.shadowBlur = 0; // Reset shadow
    }

    // the food respawn at a new random position when it eaten
    respawn() {
        this.position = this.randomPosition(); 
    }
}

// snake class
class Snake {
    constructor(color) {
        this.body = [{ x: canvas.width / 2, y: canvas.height / 2 }]; // initialize snake in center of canvas
        this.length = 5; // starter length
        this.cellSize = 20; //size of each cell of snake
        this.direction = { x: 0, y: -this.cellSize }; //the initial direction of the snake is to up
        this.nextDirection = this.direction; // Set the next direction (for smooth direction changes)
        this.updateDelay = 100; //  the delay between updates in milliseconds
        this.lastUpdateTime = 0; 
        this.color = color; // the snake color
    }

    // update the snake position and check for crashing
    update() {
        this.direction = this.nextDirection; // the next direction

        let head = { x: this.body[0].x + this.direction.x, y: this.body[0].y + this.direction.y }; // Calculate the new head position
        this.body.unshift(head); // = the new head position to the snake body

        if (this.body.length > this.length) {
            this.body.pop(); // remove the last segment if the snake body is longer than its length to update dir
        }

        // crashing with the canvas edges
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            endGame(); // end the game if the snake crashes with the edges
        }
        for (let rock of rocks) {
            if (head.x < rock.position.x + rock.size && head.x + this.cellSize > rock.position.x &&
                head.y < rock.position.y + rock.size && head.y + this.cellSize > rock.position.y) {
                endGame(); // end the game if the snake crash with rock
            }
        }
        // for eating with food
        for (let food of foods) {
             if (head.x < food.position.x + food.size && head.x + this.cellSize > food.position.x &&
                head.y < food.position.y + food.size && head.y + this.cellSize > food.position.y) {
                this.length++; // increase the snake length if it eats the food
                food.respawn(); // respawn food at a new position
                eatSound.play();
                if (loopInterval > 10) {
                    loopInterval -= 1;
                }
                if (this === snake) {
                    score++; // increase the score if the snake eats the food
                    scoreElement.textContent = score; // to update the score display

                }
            }
        }
    
        // i tried to put ai snake to chaleng with snak on food and als if crashing game ended but it not worked yet
        for (let aiSnake of aiSnakes) {
            for (let segment of aiSnake.body) {
                if (Math.abs(head.x - segment.x) < this.cellSize && Math.abs(head.y - segment.y) < this.cellSize) {
                    endGame();
                }
            }
        }
    }

    // draw snake on canvas
    draw() {
        for (let i = 0; i < this.body.length; i++) {
            ctx.fillStyle = this.color;
            let segment = this.body[i];
            if (i === 0) {
                ctx.beginPath();
                ctx.arc(segment.x + this.cellSize / 2, segment.y + this.cellSize / 2, this.cellSize * 0.75, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(segment.x + this.cellSize / 2, segment.y + this.cellSize / 2, this.cellSize / 2, 0, Math.PI * 2);
                ctx.fill();            }
        }
    }

    // reset to intial state
    reset() {
        this.body = [{ x: canvas.width / 2, y: canvas.height / 2 }]; // Reset the snake's body to one segment in the center
        this.length = 5; // Reset the snake's length
        this.direction = { x: 0, y: -this.cellSize };
    }

    // change the snake direction
    changeDirection(newDirection) {
        // Only allow direction change if the new direction is not directly opposite to the current direction
        if ((this.direction.x === 0 && newDirection.x !== 0) || (this.direction.y === 0 && newDirection.y !== 0)) {
            this.nextDirection = newDirection;
        }
    }

    // for ai snake to get nearst food to eat it
    //not worked yet 
    findNearestFood() {
        let nearestFood = null;
        let minDistance = Infinity;

        for (let food of foods) {
            let distance = Math.hypot(this.body[0].x - food.position.x, this.body[0].y - food.position.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestFood = food;
            }
        }

        return nearestFood;
    }

 // for ai snake to get nearst food to eat it
    //not worked yet 
    moveToFood() {
        let nearestFood = this.findNearestFood();
        if (nearestFood) {
            let dx = nearestFood.position.x - this.body[0].x;
            let dy = nearestFood.position.y - this.body[0].y;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.changeDirection({ x: Math.sign(dx) * this.cellSize, y: 0 })
            } else {
                this.changeDirection({ x: 0, y: Math.sign(dy) * this.cellSize })
            }
        }
    }
}
//ai snake class
        // i tried to put ai snake to chalenge with snake on food and also if crashing game ended but it not worked yet

class AISnake extends Snake {
    constructor(color) {
        super(color)
    }

    update() {
        this.moveToFood()
        super.update()
    }
}


let snake = new Snake('white'); //our snake with white color
let foods = []; 
for (let i = 0; i < 50; i++) {
    let image = i % 2 === 0 ? strawberryImg : cherryImg;
    foods.push(new Food(image))
}
let rocks = [];
for (let i = 0; i < 10; i++) { 
    let image = i % 2 === 0 ? rockImgone : rockImgtwo;
    rocks.push(new Rock(image))
}

// i put it on zero to prevent the bug 
// also i dont commented it to be noticed
let aiSnakes = [];
for (let i = 0; i < 0; i++) {
    aiSnakes.push(new AISnake('red'))
}


// draw game objects on the canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height) // clear canvas and start to draw

    snake.draw(); 
    for (let food of foods) {
        food.draw(); // loop on each food in food array and draw
    }
    for (let rock of rocks) {
        rock.draw(); // same like food
    }
}

// func to update the game state
function update() {
    snake.update(); 
   
}

// Main game loop
function gameLoop() {
    if (!gameRunning || gamePaused) return // stop the loop if the game is not running and also if it paused
    update(); 
    draw(); 

    // for (let aiSnake of aiSnakes) {
    //     aiSnake.update();
    //     aiSnake.draw();
    // }

    setTimeout(gameLoop, loopInterval); // set a timeout to call gameLoop again creating a game loop control speed  

    // scroll the window to follow the snake to make it always in center
    window.scrollTo(snake.body[0].x - window.innerWidth / 2, snake.body[0].y - window.innerHeight / 2)
}
//touch
upButton.addEventListener('click', () => {
    snake.changeDirection({ x: 0, y: -10 });
});
leftButton.addEventListener('click', () => {
    snake.changeDirection({ x: -10, y: 0 });
});
downButton.addEventListener('click', () => {
    snake.changeDirection({ x: 0, y: 10 });
});
rightButton.addEventListener('click', () => {
    snake.changeDirection({ x: 10, y: 0 });
});
// to move snake by arrows
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            snake.changeDirection({ x: 0, y: -10 }); 
            break;
        case 'ArrowDown':
            snake.changeDirection({ x: 0, y: 10 }); 
            break;
        case 'ArrowLeft':
            snake.changeDirection({ x: -10, y: 0 }); 
            break;
        case 'ArrowRight':
            snake.changeDirection({ x: 10, y: 0 }); 
            break;
    }
})

//resume and start funcs
function pauseGame() {
    gamePaused = true;
}

function resumeGame() {
    gamePaused = false;
    gameLoop(); 
}
//funcs to end and start the game
function startGame() {
    pauseResumeButton.style.display= 'flex'
    textarea.style.display= 'none'
    notice.style.display= 'none'

    gameRunning = true; 
    startButton.style.display = 'none'; 
    score = 0; // reset it
    scoreElement.textContent = score
    snake.reset()
    gameLoop(); 
    playGameMusic();

}

function endGame() {

    gameRunning = false; 
    startButton.style.display = 'block'; 
    if (score > highScore) {
        highScore = score
        localStorage.setItem('highScore', highScore)
        highScoreElement.textContent = highScore; 
    }
    pauseResumeButton.style.display= 'none'

}

pcControlButton.addEventListener('click', () => {
    isTouchScreen = false;
    controlModal.style.display = 'none';
    startGame();
});

touchControlButton.addEventListener('click', () => {
    isTouchScreen = true;
    controlModal.style.display = 'none';
    touchControls.style.display = 'flex';
    startGame();
});