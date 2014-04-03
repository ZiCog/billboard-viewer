// Shape - superclass
function Shape() {
  console.log("Shape: ");
  this.x = 0;
  this.y = 0;
}

// superclass method
Shape.prototype.move = function(x, y) {
    this.x += x;
    this.y += y;
    console.info("Shape moved.");
};

// Rectangle - subclass
function Rectangle() {
  console.log("Rectangle: ");
  Shape.call(this); // call super constructor.

}
// subclass extends superclass
Rectangle.prototype = Object.create(Shape.prototype);
Rectangle.prototype.constructor = Rectangle;



var rect = new Rectangle();


//rect.move(1, 1); // Outputs, "Shape moved."

console.log(rect instanceof Rectangle); // true.
console.log(rect instanceof Shape); // true.
