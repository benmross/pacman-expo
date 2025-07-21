import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const CELL_SIZE = 20;
const BOARD_WIDTH = Math.floor(width / CELL_SIZE);
const BOARD_HEIGHT = Math.floor((height - 200) / CELL_SIZE);

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  id: number;
  position: Position;
  direction: string;
  color: string;
}

const MAZE = Array(BOARD_HEIGHT).fill(null).map((_, y) => 
  Array(BOARD_WIDTH).fill(null).map((_, x) => {
    if (x === 0 || x === BOARD_WIDTH - 1 || y === 0 || y === BOARD_HEIGHT - 1) return 1;
    if (x % 4 === 0 && y % 4 === 0) return 1;
    return Math.random() < 0.15 ? 1 : 0;
  })
);

const INITIAL_DOTS = Array(BOARD_HEIGHT).fill(null).map((_, y) => 
  Array(BOARD_WIDTH).fill(null).map((_, x) => 
    MAZE[y][x] === 0 ? 1 : 0
  )
);

export default function App() {
  const [pacmanPosition, setPacmanPosition] = useState<Position>({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState<Ghost[]>([
    { id: 1, position: { x: BOARD_WIDTH - 2, y: 1 }, direction: 'left', color: '#ff0000' },
    { id: 2, position: { x: 1, y: BOARD_HEIGHT - 2 }, direction: 'up', color: '#00ff00' },
    { id: 3, position: { x: BOARD_WIDTH - 2, y: BOARD_HEIGHT - 2 }, direction: 'left', color: '#0000ff' },
  ]);
  const [dots, setDots] = useState(INITIAL_DOTS);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const isValidMove = (x: number, y: number) => {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && MAZE[y][x] === 0;
  };

  const movePacman = (newX: number, newY: number) => {
    if (!isValidMove(newX, newY) || gameOver) return;
    
    setPacmanPosition({ x: newX, y: newY });
    
    if (dots[newY][newX] === 1) {
      setDots(prev => {
        const newDots = [...prev];
        newDots[newY] = [...newDots[newY]];
        newDots[newY][newX] = 0;
        return newDots;
      });
      setScore(prev => prev + 10);
    }
  };

  const moveGhosts = () => {
    setGhosts(prev => prev.map(ghost => {
      const directions = [
        { dx: 0, dy: -1, name: 'up' },
        { dx: 0, dy: 1, name: 'down' },
        { dx: -1, dy: 0, name: 'left' },
        { dx: 1, dy: 0, name: 'right' }
      ];
      
      const validMoves = directions.filter(dir => 
        isValidMove(ghost.position.x + dir.dx, ghost.position.y + dir.dy)
      );
      
      if (validMoves.length === 0) return ghost;
      
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      return {
        ...ghost,
        position: {
          x: ghost.position.x + randomMove.dx,
          y: ghost.position.y + randomMove.dy
        },
        direction: randomMove.name
      };
    }));
  };

  const checkCollisions = () => {
    ghosts.forEach(ghost => {
      if (ghost.position.x === pacmanPosition.x && ghost.position.y === pacmanPosition.y) {
        setGameOver(true);
      }
    });
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;
    const threshold = 30;
    
    if (Math.abs(translationX) > Math.abs(translationY)) {
      if (translationX > threshold) {
        movePacman(pacmanPosition.x + 1, pacmanPosition.y);
      } else if (translationX < -threshold) {
        movePacman(pacmanPosition.x - 1, pacmanPosition.y);
      }
    } else {
      if (translationY > threshold) {
        movePacman(pacmanPosition.x, pacmanPosition.y + 1);
      } else if (translationY < -threshold) {
        movePacman(pacmanPosition.x, pacmanPosition.y - 1);
      }
    }
  };

  useEffect(() => {
    if (!gameOver) {
      gameLoopRef.current = setInterval(() => {
        moveGhosts();
        checkCollisions();
      }, 500);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [pacmanPosition, gameOver]);

  const resetGame = () => {
    setPacmanPosition({ x: 1, y: 1 });
    setGhosts([
      { id: 1, position: { x: BOARD_WIDTH - 2, y: 1 }, direction: 'left', color: '#ff0000' },
      { id: 2, position: { x: 1, y: BOARD_HEIGHT - 2 }, direction: 'up', color: '#00ff00' },
      { id: 3, position: { x: BOARD_WIDTH - 2, y: BOARD_HEIGHT - 2 }, direction: 'left', color: '#0000ff' },
    ]);
    setDots(INITIAL_DOTS);
    setScore(0);
    setGameOver(false);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>Score: {score}</Text>
        {gameOver && (
          <Text style={styles.gameOver} onPress={resetGame}>
            GAME OVER - Tap to restart
          </Text>
        )}
      </View>
      
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <View style={styles.gameBoard}>
          {Array(BOARD_HEIGHT).fill(null).map((_, y) => (
            <View key={y} style={styles.row}>
              {Array(BOARD_WIDTH).fill(null).map((_, x) => (
                <View key={`${x}-${y}`} style={[
                  styles.cell,
                  MAZE[y][x] === 1 && styles.wall,
                ]}>
                  {dots[y][x] === 1 && (
                    <View style={styles.dot} />
                  )}
                  {pacmanPosition.x === x && pacmanPosition.y === y && (
                    <Text style={styles.pacmanEmoji}>🟡</Text>
                  )}
                  {ghosts.some(ghost => ghost.position.x === x && ghost.position.y === y) && (
                    <Text style={styles.ghostEmoji}>👻</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </PanGestureHandler>
      
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  score: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameOver: {
    color: '#ff0000',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  gameBoard: {
    backgroundColor: '#000',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wall: {
    backgroundColor: '#0000ff',
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  pacman: {
    backgroundColor: '#000',
  },
  ghost: {
    backgroundColor: '#000',
  },
  pacmanEmoji: {
    fontSize: CELL_SIZE * 0.8,
  },
  ghostEmoji: {
    fontSize: CELL_SIZE * 0.8,
  },
});
