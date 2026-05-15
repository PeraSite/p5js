function checkCircleRectCollision(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  let closestX = constrain(circleX, rectX - rectWidth / 2, rectX + rectWidth / 2);
  let closestY = constrain(circleY, rectY - rectHeight / 2, rectY + rectHeight / 2);

  return dist(circleX, circleY, closestX, closestY) <= circleRadius;
}

function getCircleRectCollisionSide(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  let overlapX = rectWidth / 2 + circleRadius - abs(circleX - rectX);
  let overlapY = rectHeight / 2 + circleRadius - abs(circleY - rectY);

  if (overlapX < overlapY) {
    return "horizontal";
  }

  return "vertical";
}
