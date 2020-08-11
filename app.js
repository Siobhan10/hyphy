// Screen
var scrWidth;
var scrHeight;
var scrHorizon;
var skyColor; // can't use color() here because setup() hasn't run yet!
var groundColor;
// Area 
var minX=-1000;
var maxX=1000;
var minY=-1000;
var maxY=1000;

// Player
var playerX=0;
var playerY=0;
var playerAngle=90;
var nextFireFrame=0;
// Keyboard code choices
var kbForward=38;  //Up arrow
var kbBackward=40; //Down arrow
var kbRotateLeft=88;
var kbRotateRight=90;
var kbRotateLeftAlt=39;
var kbRotateRightAlt=37;
var kbFire=32;
// Score
var score=0;
var lives=3;
var ammo=20;
var food=100;
var fuel=100;
var health=100;
var karma=100;
var enemytanks=0;

// Sprites
var sprites=[];
var clouds=[];
var llamaSprites=[];
var tank1Sprites=[];
var tank2Sprites=[];
var fireSprites=[];
// Images
var tree;
var mycloud;
var llama;
var beans;
var bushgreen;
var bushred;
var car1;
var car2;
var cactus;
var exp1;
var exp2;
var exp3;
var fire;
var flower;
var grass;
var house1;
var house2;
var medical;
var mine1;
var mine2;
var soda;
var statue1;
var statue2;
var tank1;
var tank2;
var tankshell;
var snowman;

// Image arrays
var llamaImages=[];
var tank1Images=[];
var tank2Images=[];

// Sounds
//var backmusic;
var enemy;
var fireball;
var foundfood;
var hit;
var sheep;
var statSound;
// Background clouds
class Cloud{
  constructor(a,w,h,s,alt,i){
    this.angle=a;
    this.width=w;
    this.height=h;
    this.speed=s;
    this.alt=alt;
    this.image=i;
  }
  update(){
    this.angle+=this.speed;
    if(this.angle>TWO_PI) this.angle-=TWO_PI;
  }
}

//Static sprites
class Sprite {
  constructor(x, y, size, image) {
    this.x=x;
    this.y=y;
    this.size=size;
    this.currentImage=image;
    this.dx=0.0;
    this.dy=0.0;
    this.dist=0.0;
  }
  calcRelative(ox, oy) {
    this.dx=this.x-ox;
    this.dy=this.y-oy;
    this.dist=sqrt(this.dx*this.dx+this.dy*this.dy);
  }
}

class FireSprite extends Sprite{
  constructor(){
    super(1e6,1e6,6,fire);
    this.angle=0;
    this.orgininator=null;
    this.timeout=0; 
  }
  isFree(){
    return (this.x>1e5);
  }
  offScreen(){
    this.x=1e6;
    this.y=1e6;
    this.currentImage=fire;
    this.timeout=0;
  }
  move(){
    if(this.timeout===0) return;
    this.timeout--;
    if(this.timeout===0) this.offScreen();  // didn't hit anything
    this.x+=2.5*cos(this.angle);  // move speed 2.5
    this.y+=2.5*sin(this.angle);
    if(this.originator!==null) {  // not player's shell (player originator=null)
       if(dist(this.x,this.y,playerX,playerY)<2.5){ // player hit
         health-=33;
         if(health<0) health=0;
         this.currentImage=exp1;
         hit.play();
         this.timeout=0;
         return;
       }
    }
    for(var i=0;i<tank1Sprites.length;i++){
       var ts=tank1Sprites[i];
       if(ts===this.originator || ts.isdead) continue;
       if(dist(this.x,this.y,ts.x,ts.y)<2.5){
         if(ts.originator===null){
           score+=2000;
         }
         score+=500;
         ts.isdead=true;
         ts.currentImage=exp3;
         this.currentImage=exp1;
         hit.play();
         enemytanks--;
         this.timeout=0;
         return;
       }
    }
    for(var i=0;i<tank2Sprites.length;i++){
       var ts=tank2Sprites[i];
       if(ts===this.originator || ts.isdead) continue;
       if(dist(this.x,this.y,ts.x,ts.y)<2.5){
         if(ts.originator===null){
           score+=3000;
         }
         score+=1000;
         ts.isdead=true;
         ts.currentImage=exp3;
         this.currentImage=exp1;
         hit.play();
         enemytanks--;
         this.timeout=0;
         return;
       }
    }
  }  
}
function findFreeFireSprite(){
  for(var i=0;i<fireSprites.length;i++){
    if(fireSprites[i].isFree()) return fireSprites[i];
  }
  return null;
}
//LLama Sprite
class LSprite extends Sprite{
  constructor(x,y,size,images){
    super(x,y,size,images[0]);
    this.images=images;
    this.angle=0;
    this.sleep=0;
    this.destX=0;
    this.destY=0;
    this.frame=0;
  }
  move(){
    var mask=(this.sleep>0)? 127:15;
    if((frameCount & mask)===0){
        this.frame++;
        if(this.frame===4) this.frame=0;
    }
    var baseAngle=this.angle-atan2(playerY-this.y,playerX-this.x)-QUARTER_PI;
    var frameDir=cos(baseAngle)<0? 1:0;
    frameDir+=sin(baseAngle)<0? 2:0;
    frameDir=[4,0,8,12][frameDir];
    this.currentImage=this.images[this.frame+frameDir];
    this.sleep--;
    if(this.sleep>0) return; //sleep -1
    if(dist(this.x,this.y,this.destX,this.destY)<5){
      this.sleep=60*5;
      this.destX=random(minX,maxX);
      this.destY=random(minY,maxY);
    }else{
       this.angle=atan2(this.destY-this.y,this.destX-this.x);
       this.x+=0.02*cos(this.angle);
       this.y+=0.02*sin(this.angle);
    }
    if(dist(this.x,this.y,playerX,playerY)<5){
      karma-=7.5;
      if(karma<0) karma=0;
      food+=2;
      if(food>100) food=100;
      sheep.play();
      this.x=random(minX,maxX);
      this.y=random(minY,maxY);
    }
  }
}

//Tank1 Sprite
class T1Sprite extends Sprite{
  constructor(x,y,size,images){
    super(x,y,size,images[0]);
    this.images=images;
    this.angle=0;
    this.sleep=0;
    this.destX=0;
    this.destY=0;
    this.frame=0;
    this.isdead=false;
    this.nextFire=0;
  }
  move(){
    if(this.isdead) return;
    var mask=(this.sleep>0)? 127:15;
    if((frameCount & mask)===0){
        this.frame++;
        if(this.frame===3) this.frame=0;
    }
    var baseAngle=this.angle-atan2(playerY-this.y,playerX-this.x)-QUARTER_PI;
    var frameDir=cos(baseAngle)<0? 1:0;
    frameDir+=sin(baseAngle)<0? 2:0;
    frameDir=[3,9,0,6][frameDir];
    this.currentImage=this.images[this.frame+frameDir];
    this.sleep--;
    if(this.sleep>0) return; //sleep -1
    if(random()<0.001) this.sleep=int(random(100));
    if(dist(this.x,this.y,this.destX,this.destY)<5){
      this.sleep=60;
      this.destX=random(minX,maxX);
      this.destY=random(minY,maxY);
      return;
    }
    if(karma===0 && (frameCount&511)===0){
      this.destX=playerX+random(-10,10);
      this.destY=playerY+random(-10,10);
    } 
    if(this.dist<150 && frameCount>this.nextFire){
      this.nextFire=frameCount+150;
      this.destX=playerX;
      this.destY=playerY;
      var ff=findFreeFireSprite();
      if(ff !== null){
        ff.x=this.x;
        ff.y=this.y;
        ff.angle=this.angle;
        ff.originator=this;
        ff.timeout=140;  // range
        enemy.play();
      }
    }
    this.angle=atan2(this.destY-this.y,this.destX-this.x);
    this.x+=0.05*cos(this.angle);
    this.y+=0.05*sin(this.angle);  
  }
}

//Tank2 Sprite
class T2Sprite extends Sprite{
  constructor(x,y,size,images){
    super(x,y,size,images[0]);
    this.images=images;
    this.angle=0;
    this.sleep=0;
    this.destX=0;
    this.destY=0;
    this.frame=0;
    this.isdead=false;
    this.nextFire=0;
  }
  move(){
    if(this.isdead) return;
    var mask=(this.sleep>0)? 127:15;
    if((frameCount & mask)===0){
        this.frame++;
        if(this.frame===3) this.frame=0;
    }
    var baseAngle=this.angle-atan2(playerY-this.y,playerX-this.x)-QUARTER_PI;
    var frameDir=cos(baseAngle)<0? 1:0;
    frameDir+=sin(baseAngle)<0? 2:0;
    frameDir=[3,9,0,6][frameDir];
    this.currentImage=this.images[this.frame+frameDir];
    this.sleep--;
    if(this.sleep>0) return; //sleep -1
    if(random()<0.001) this.sleep=int(random(100));
    if(dist(this.x,this.y,this.destX,this.destY)<5){
      this.sleep=120;
      this.destX=random(minX,maxX);
      this.destY=random(minY,maxY);
      return;
    }
    if(karma===0 && (frameCount&511)===0){
      this.destX=playerX+random(-10,10);
      this.destY=playerY+random(-10,10);
    } 
    if(this.dist<200 && frameCount>this.nextFire){
      this.nextFire=frameCount+210;
      this.destX=playerX;
      this.destY=playerY;
      var ff=findFreeFireSprite();
      if(ff !== null){
        ff.x=this.x;
        ff.y=this.y;
        ff.angle=this.angle+random(-0.05,0.05);
        ff.originator=this;
        ff.timeout=200;  // range
        enemy.play();
      }
    }
    this.angle=atan2(this.destY-this.y,this.destX-this.x);
    this.x+=0.1*cos(this.angle);
    this.y+=0.1*sin(this.angle);    
    
  }
}

// Preload
function preload(){
  // Preload Images
  beans=loadImage('images/beans.png');
  bushgreen=loadImage('images/bushgreen.png');
  bushred=loadImage('images/bushred.png');
  car1=loadImage('images/car1.png');
  car2=loadImage('images/car2.png');
  cactus=loadImage('images/cactus.png');
  mycloud=loadImage('images/cloud.png');
  exp1=loadImage('images/exp1.png');
  exp2=loadImage('images/exp2.png');
  exp3=loadImage('images/exp3.png');
  fire=loadImage('images/fire.png');
  flower=loadImage('images/flower.png');
  grass=loadImage('images/grass.png');
  house1=loadImage('images/house1.png');
  house2=loadImage('images/house2.png');
  llama=loadImage('images/llama.png');
  medical=loadImage('images/medical.png');
  mine1=loadImage('images/mine1.png');
  mine2=loadImage('images/mine2.png');
  soda=loadImage('images/soda.png');
  statue1=loadImage('images/statue1.png');
  statue2=loadImage('images/statue2.png'); 
  tank1=loadImage('images/tank1.png');
  tank2=loadImage('images/tank2.png');
  tankshell=loadImage('images/tankshell.png');
  tree=loadImage('images/tree.png');
  snowman=loadImage('images/snowman.png');
  // Preload Sounds  
  enemy=loadSound('sounds/enemy.mp3');
  fireball=loadSound('sounds/fireball.mp3');
  foundfood=loadSound('sounds/foundfood.mp3');
  hit=loadSound('sounds/hit.mp3');
  sheep=loadSound('sounds/sheep.mp3');
  statSound=loadSound('sounds/statSound.mp3');
}

//function soundloopCB(){
//  backmusic.loop(); 
//}

function animationLoad(){
  for(var i=0;i<16;i++){
     var img=createImage(50,70);
     img.copy(llama,128*(i%4)+40,128*int(i/4)+23,50,70,0,0,50,70);
     llamaImages[i]=img;
  }
  for(var i=0;i<12;i++){
     var img=createImage(64,62);
     img.copy(tank1,64*(i%3),64*int(i/3),64,64,0,0,64,64);
     tank1Images[i]=img;
  }
  for(var i=0;i<12;i++){
     var img=createImage(75,67);
     img.copy(tank2,75*(i%3),75*int(i/3),70,70,0,0,70,70);
     tank2Images[i]=img;
  }
  
}

function setup(){
  p5.disableFriendlyErrors = true;
  scrWidth=windowWidth-50;
  scrHeight=windowHeight-50;
  scrHorizon=int(scrHeight/3);
  skyColor=color(20,20,255);
  groundColor=color(20,255,20);
  var cc=createCanvas(scrWidth,scrHeight);
  cc.parent('myContainer');
  background(0);
  fill(255);
  noStroke();
  animationLoad();
// Sound mode
  enemy.playMode('restart');
  fireball.playMode('restart');
  foundfood.playMode('restart');
  hit.playMode('restart');
  sheep.playMode('restart');
  statSound.playMode('restart');
  restartgame();
  //backmusic=loadSound('sounds/backmusic.mp3',soundloopCB);
}
function restartgame(){
  playerX=0;
  playerY=0;
  playerAngle=90;
  extFireFrame=0;
  score=0;
  lives=3;
  ammo=20;
  food=100;
  fuel=100;
  health=100;
  karma=100;
  enemytanks=0;
  sprites=[];
  clouds=[];
  llamaSprites=[];
  tank1Sprites=[];
  tank2Sprites=[];
  fireSprites=[];  
// Set up static sprites   
  for(var i=0;i<100;i++){
     sprites.push(new Sprite(random(minX,0),random(minY,0),10,house1));
  }
  for(var i=0;i<50;i++){
     sprites.push(new Sprite(random(minX,0),random(minY,0),10,house2));
     sprites.push(new Sprite(random(minX,maxX),random(minY,0),10,car1));
     sprites.push(new Sprite(random(minX,0),random(minY,maxY),10,car2));
     sprites.push(new Sprite(random(0,maxX),random(0,maxY),10,cactus));
     sprites.push(new Sprite(random(0,maxX*0.5),random(0,maxY*0.3),10,bushred));    
     sprites.push(new Sprite(random(0,maxX),random(minY,maxY),10,bushgreen));
     sprites.push(new Sprite(random(minX,maxX),random(minY,maxY),3,beans));
     sprites.push(new Sprite(random(minX,0),random(0,maxY),3,grass));
     sprites.push(new Sprite(random(minX,0),random(0,maxY*0.7),3,flower));
     sprites.push(new Sprite(random(minX,0),random(minY,0),3,mine1));
     sprites.push(new Sprite(random(0,maxX),random(0,maxY),3,mine1));
     sprites.push(new Sprite(random(minX*0.5,maxX*0.5),random(minY*0.5,maxY*0.5),3,mine2));
     sprites.push(new Sprite(random(minX,maxX),random(minY,maxY),3,soda));
     sprites.push(new Sprite(random(minX*0.7,maxX),random(minY,maxY*0.8),3,tankshell));
  }
  for(var i=0;i<25;i++){
    sprites.push(new Sprite(random(0,maxX),random(0,maxY),6,medical));
    sprites.push(new Sprite(random(0,maxX),random(0,maxY),10,statue1));
    sprites.push(new Sprite(random(maxX*0.5,maxX),random(maxY*0.5,maxY),15,statue2));
    sprites.push(new Sprite(random(minX,0),random(minY,0),15,tree));
    sprites.push(new Sprite(random(0,maxX),random(minY,0),15,tree));
    sprites.push(new Sprite(random(minX,0),random(0,maxY),15,tree));
  }
// Set up movable sprites
  // Fire sprites
  for(var i=0;i<10;i++){
    var fs=new FireSprite();
    fireSprites.push(fs);
    sprites.push(fs);
  }
  //llama sprites
  for(var i=0;i<20;i++){
    var ll=new LSprite(int(random(200,250)),int(random(200,250)),10,llamaImages);
    llamaSprites.push(ll);
    sprites.push(ll);
  }
  for(var i=0;i<20;i++){
    var t1=new T1Sprite(int(random(100,maxX)),int(random(100,maxY)),10,tank1Images);
    tank1Sprites.push(t1);
    sprites.push(t1);
    enemytanks++;
  }
   for(var i=0;i<20;i++){
    var t2=new T2Sprite(int(random(minX,-100)),int(random(minY,-100)),10,tank2Images);
    tank2Sprites.push(t2);
    sprites.push(t2);
    enemytanks++;
  }
  for(var i=0;i<20;i++){
    var c=new Cloud(random(TWO_PI),random(20,50),random(20,50),random(0.00001,0.00005),random(scrHorizon-50),mycloud);
    clouds.push(c);
  }
}

function draw(){
  if((frameCount&1023)===0 && fuel>0) fuel-=1;
  if((frameCount&255)===0){
    if(health<100 && food>0){
      health+=1;
      food-=1;
    } 
  }
  if(enemytanks===0){
	image(snowman,random(-5,screenWidth+5),random(-5,scrHeight+5));
    fill('orange');
    textSize(32);
    text('YOU WIN! R to Restart',scrWidth/2-170,scrHeight/2);
    if(keyIsDown(82)) restartgame(); 
    return;  
  }
  if(health===0){
    lives-=1;
    health=100;
  }
  if(lives<1){
    fill(255);
    textSize(32);
    text('YOU LOSE! R to Restart',scrWidth/2-170,scrHeight/2);
    if(keyIsDown(82)) restartgame(); 
    return;
  }
  fill(skyColor);
  rect(0,0,scrWidth,scrHorizon);
  fill(groundColor);
  rect(0,scrHorizon,scrWidth,scrHeight-scrHorizon);
  var sp=(fuel===0)? 0.4:1.2;
  var moveX=sp*cos(radians(playerAngle));
  var moveY=sp*sin(radians(playerAngle)); 
  if (keyIsDown(kbForward)) {
    playerX+=moveX;
    playerY+=moveY;
  }
  if (keyIsDown(kbBackward)) {
    playerX-=moveX;
    playerY-=moveY;
  }
  if (keyIsDown(kbRotateLeft) || keyIsDown(kbRotateLeftAlt)) playerAngle+=1;
  if (keyIsDown(kbRotateRight) || keyIsDown(kbRotateRightAlt)) playerAngle-=1;
  if (playerAngle<0) playerAngle=359;
  if (playerAngle>359) playerAngle=0;
  if (ammo>0 && frameCount>nextFireFrame && keyIsDown(kbFire)){
      var ff=findFreeFireSprite();
      if(ff !== null){
        nextFireFrame=frameCount+15;  // you can fire again in 15 more frames
        ff.x=playerX;
        ff.y=playerY;
        ff.angle=radians(playerAngle);
        ff.originator=null;
        ff.timeout=200;  // range
        ammo-=1;
        fireball.play();
      }
  }
// Move Sprites  
  for(var i=0;i<fireSprites.length;i++){
    fireSprites[i].move();
  }
  for(var i=0;i<llamaSprites.length;i++){
    llamaSprites[i].move();
  }
  for(var i=0;i<tank1Sprites.length;i++){
    tank1Sprites[i].move();
  }
   for(var i=0;i<tank2Sprites.length;i++){
    tank2Sprites[i].move();
  }
  var rAngle=radians(playerAngle);
  for(var i=0;i<clouds.length;i++){  // display clouds
    var c=clouds[i];
    c.update();
    var objAngle=c.angle-rAngle;
    if(cos(objAngle)<0.0) continue;
    image(c.image, scrWidth*sin(objAngle)+(scrWidth-c.width)*0.5,c.alt,c.width,c.height);
  }
  for (var i=0;i<sprites.length;i++){ // Start to display sprites
    sprites[i].calcRelative(playerX, playerY);
  }
  sprites.sort(function (a,b){return b.dist-a.dist;});
  var i=0;
  for(var dlimit=scrHeight-scrHorizon;i<sprites.length;i++) if(sprites[i].dist<dlimit) break; //distance limit
  for (;i<sprites.length;i++) {
    var spr=sprites[i];
    if(spr.currentImage==exp1){
      if((frameCount&15)==0) spr.currentImage=exp2;
    }else if(spr.currentImage==exp2){
      if((frameCount&15)==0) {
        if(spr instanceof FireSprite){
          spr.offScreen();
        }else{
           spr.currentImage=exp3;
        }
      }  
    }
    var objAngle=atan2(spr.dy, spr.dx)-rAngle;
    if (cos(objAngle)<0.0) continue; 
    if (spr.dist<1.0) continue;
    var size=spr.size/spr.dist;
    var wDisplay=size*spr.currentImage.width;
    var hDisplay=size*spr.currentImage.height;    
    image(spr.currentImage, scrWidth*sin(objAngle)+(scrWidth-wDisplay)*0.5, scrHeight-spr.dist-hDisplay, wDisplay, hDisplay);
    if(spr.dist<15){// deal with static sprite behaviour
      var ci=spr.currentImage;
       if(ci==mine1){
        health-=10;
        if(health<0) health=0
        hit.play();
        spr.currentImage=exp1;
      }
      if(ci==mine2){
        health-=25;
        if(health<0) health=0
        hit.play();
        spr.currentImage=exp1;
      }
    }   
    if(spr.dist<5){// deal with static sprite behaviour
      var ci=spr.currentImage;
      if(ci==beans || ci==soda){
        food+=3;
        if(ci==beans) food+=5;
        if(food>100) food=100;
        health+=2;
        if(health>100) health=100;
        foundfood.play();
        spr.x=random(0,maxX);
        spr.y=random(minY,0);
        score+=33;
      }
      if(ci==car1 || ci==car2){
        fuel+=1;
        if(ci==car2) fuel+=2;
        if(fuel>100) fuel=100;
        foundfood.play();
        spr.x=random(minX,maxX);
        spr.y=random(minY,maxY);
        score+=25;
      }
      if(ci==medical){
        health+=50;
        if(health>100) health=100;
        foundfood.play();
        spr.x=random(0,maxX);
        spr.y=random(minY,0);
        score+=500;
      }
      if(ci==statue1 || ci==statue2){
        karma+=5;
        if(ci==statue2) karma+=5;
        if(karma>100) karma=100;
        health+=2;
        if(health>100) health=100;
        spr.x=random(0,maxX);
        spr.y=random(minY,0);
        statSound.play();
        score+=100;
      }
      if(ci==tankshell){
        ammo+=100;
        if(ammo>999) ammo=999;
        foundfood.play();
        spr.x=random(0,maxX);
        spr.y=random(minY,0);
        score+=250;
      }
    }
  }
  fill(255);
  textSize(12);
  text("Lives: "+lives,5,15);
  text('Ammo: '+ammo,5,30);
  text('Health: '+health,80,15);
  text("Fuel: "+fuel,80,30);
  text('Enemy Tanks:'+enemytanks,scrWidth-115,15);
  text('Score: '+score,scrWidth-115,30);
 
}
