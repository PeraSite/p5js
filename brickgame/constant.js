// 캔버스는 정사각형으로 고정해서 벽돌 위치 계산을 단순하게 한다.
const CANVAS_SIZE = 600;

// 공 속도는 무한 점수 모드의 난이도를 결정한다.
const INITIAL_BALL_SPEED = 6;
const MAX_BALL_SPEED = 12;
const SPEED_UP_RATE = 1.08;

// 한 번 실수해도 바로 끝나지 않도록 기본 목숨을 둔다.
const START_LIVES = 3;

const BALL_RADIUS = 11;

const PADDLE_WIDTH = 110;
const PADDLE_HEIGHT = 18;
const PADDLE_SPEED = 8;

// 패들을 바닥에서 조금 띄워 공을 받을 공간을 만든다.
const PADDLE_BOTTOM_MARGIN = 55;

// 상단 UI와 좌우 가장자리를 게임 영역에서 분리한다.
const PLAY_AREA_SIDE_MARGIN = 24;
const PLAY_AREA_TOP = 52;

// 벽돌은 2차원 배열 구조가 잘 보이도록 행과 열을 고정한다.
const BRICK_ROWS = 4;
const BRICK_COLS = 6;
const BRICK_WIDTH = 82;
const BRICK_HEIGHT = 30;
const BRICK_GAP = 10;
const BRICK_TOP = 90;

// 벽돌 체력은 1~3 사이에서 단순 랜덤으로 정한다.
const BRICK_HEALTH_MIN = 1;
const BRICK_HEALTH_MAX = 3;
const BRICK_SCORE_MULTIPLIER = 10;

// 체력이 줄어든 벽돌은 색을 연하게 보여준다.
const BRICK_MIN_ALPHA = 95;
const BRICK_MAX_ALPHA = 255;

const BRICK_COLORS = [
  [255, 92, 124],
  [255, 180, 75],
  [74, 211, 255],
];

// 시작할 때 공이 완전히 수직으로만 올라가면 플레이가 단조로워진다.
const INITIAL_LAUNCH_X_RATIO = 0.45;

// 패들 가장자리에 맞은 공이 너무 수평으로만 날아가지 않게 보정한다.
const PADDLE_BOUNCE_X_WEIGHT = 0.45;
