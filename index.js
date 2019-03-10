let express = require('express');
let app = express();

let cors = require("cors");
app.use(cors());

let bodyParser = require('body-parser');
app.use(bodyParser.json());

app.listen(5000, function() {
    console.log('Our srever is ready');
});

// data *************************************
rooms = [
    // {idroom: 101, roomInitPLayers: 0, roomState: "Комнатушка1"},
];

createBlankRoom = () => {
    return {
        field: [
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0]
        ],
        players: {
          currentPlayer: 1,
          playersArr: [ {id: 1, name: "Игрок1"}, {id:2, name: "Игрок2"} ]
        },
        messageText: "игра в самом разгаре...",
        isGaming: true,
        isWarning: false,
        roomID: -1,
        roomStatus: 0 // 0-created, 1-waiting, 2-playing, 3-closed
      }
}

// rooms logic ******************************
const roomsIDGenerator = function createIDgenerator() {
    let globalIDRoom = 0;
    return function generateNewID() {
        return globalIDRoom++;
    }
}();

findRoomByID = (roomID) => {
    // console.log("Пришли искать мою комнату по id: "+roomID);
    return rooms.filter( item => item.idroom === roomID );
}

deleteRoomByID = (roomID) => {
    console.log("deleteRoomByID");
    let deleteRoomIndex = rooms
        .map( (item, i) => item.idroom === roomID ? i : -1 )
        .filter( item => item !== -1);

    if (deleteRoomIndex.length !== 0) {
        rooms.splice(deleteRoomIndex[0], 1);
        return true;
    }
    return false;
}

// listeners *******************************

app.post("/room", function(req, res){
    // console.log("/room");
    let foundRooms = findRoomByID(req.body.roomID);
    let yourPlayerIDInRoom = req.body.yourPlayerIDInRoom;

    if (foundRooms.length === 0) {
        res.send(
            { foundRoom: false, rooms: this.rooms }
        );
    } else {
      if ( yourPlayerIDInRoom === undefined ) {
        // if ( foundRooms[0].roomInitPLayers === foundRooms[0].roomState.MAX_PLAYERS_COUNT) {
        //  MAX_PLAYERS_COUNT - сколько максимум может быть игроков
        //  в этой версии возможности менять этот параметр нет, но потом он нужен будет
        // }

        // здесь есть костыль - почему-то id игроков в конкретной игре начинаются с "1", а не с "0"
        // при трех возможных игроках здесь проверка на статус посложнее делать надо
        foundRooms[0].roomInitPLayers++;
        yourPlayerIDInRoom = foundRooms[0].roomInitPLayers;
        foundRooms[0].roomState.roomStatus++;
      }

      res.send(
          {   foundRoom: true,
              rooms: foundRooms[0],
              roomdID: foundRooms[0].idroom,
              yourPlayerIDInRoom
          }
      );

    }
});

app.get("/createnewroom", function(req, res){
    console.log("/createnewroom");
    let newID = roomsIDGenerator();
    let blankRoom = createBlankRoom();
    blankRoom.roomID = newID;
    // console.log(blankRoom);
    this.rooms.push( {idroom: newID, roomState: blankRoom, roomInitPLayers: 0 } );
    res.send(
        {   foundRoom: true,
            rooms: this.rooms,
            roomdID: newID }
    );
});

app.post("/delroom", function(req, res){
    console.log("/delroom");
    if ( deleteRoomByID(req.body.roomID) ) {
        res.send( {isDelete: true, rooms: this.rooms} );
    } else {
        res.send( {isDelete: flase} );
    }
});

app.post("/game/reset", function(req, res){
    console.log("/reset");
    this.onClickOnReset (req.body.roomID);
});

app.post("/game/move", function(req, res){
    console.log("---> передали управление ходом на сервер - room: " + req.body.roomID + " колонка: " + req.body.columnNuber);
    this.onClickOnField (req.body.roomID, req.body.columnNuber);
    let foundRooms = findRoomByID(req.body.roomID);
    res.send( { foundRoom: true,
      rooms: foundRooms[0],
      roomdID: foundRooms[0].idroom });
});

// game logic *******************************

onClickOnField = (roomID, columnNuber) => {
    console.log("------>> Делаем ход - roomID: " + roomID + " : columnNuber: " + columnNuber);
    let foundRooms = findRoomByID(roomID)[0].roomState;
    console.log("foundRooms.isGaming: "+foundRooms.isGaming);
    // console.log("foundRooms.field: "+foundRooms.field);
    
    if (!foundRooms.isGaming) return;

    // проверяем - есть ли в колонке свободные ячейки    
    let index = foundRooms.field[columnNuber].lastIndexOf(0);
    console.log("index: "+index);
    if (index === -1) {
        console.log("А нету больше сволбодных ячеек!!!!!!!!!");
        if (foundRooms.messageText === "игра в самом разгаре...") {
          foundRooms.messageText = "В данной колонке нет сводобных ячеек";
          foundRooms.isWarning = true;
        }
      return;
    }

    // если надо - обновляем строку-сообщение и стиль сообщения
    if (foundRooms.messageText !== "игра в самом разгаре...") {
      foundRooms.messageText = "игра в самом разгаре...";
      foundRooms.isWarning = flase;
    }

    // обновляем состояние поля (кладем фишку)
    let currentPlayer = foundRooms.players.currentPlayer;
    // let newField = [...foundRooms.field];
console.log("сейчас будем бюросать фишку - колонка: "+columnNuber+" индекс: "+index+" игрок: "+currentPlayer);
    foundRooms.field[columnNuber][index] = currentPlayer;
    // foundRooms.field = newField;

console.log("новое поле: " + foundRooms.field);

    
    // ищем линию из 4-х или более фишек
    let winLine = isWinSecond(foundRooms, columnNuber, index, currentPlayer);

    if (winLine.length >= 4) { // если нашли победную линию
      
      for (let i = 0; i < winLine.length; i ++) { // выделим ее красным цветом
        foundRooms.field[winLine[i].column][winLine[i].index] += 10;
      }
      // foundRooms.field = newField;
      foundRooms.messageText = "Выиграл " + foundRooms.players.playersArr[currentPlayer-1].name;
      foundRooms.isGaming = false;
      
      return;
    }
    // меняем игрока
    changePlayer(foundRooms);
  }
  
  changePlayer = (foundRooms) => {
    console.log("changePlayer");
    let newPlayer = foundRooms.players;
    newPlayer.currentPlayer = (newPlayer.currentPlayer === 1) ? 2 : 1;
    foundRooms.players = newPlayer;
  }

  onClickOnReset = (roomID) => {
    console.log("onClickOnReset");
    let foundRooms = findRoomByID(roomID)[0].roomState;

    // if (foundRooms.isGaming) {
    //   let isReset = window.confirm("Вы уверены, что хотите начать игру сначала?");
    //   if (!isReset) return;
    // }

    let newPlayer = foundRooms.players;
    newPlayer.currentPlayer = 1;
    let newField = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0]
    ];
    foundRooms.players = newPlayer;
    foundRooms.field = newField;
    foundRooms.isGaming = true;
    foundRooms.messageText = "игра в самом разгаре...";
    foundRooms.isWarning = false;
  }

//   onClickOnStatusBar = () => {
//     this.onClickOnReset();
//   }

  isWinSecond = (foundRooms, beginColumn, beginIndex, currentPlayer) => {
    
    debugger;

    console.log("isWinSecond");
    console.log("Пришли считать линии: foundRooms - " + foundRooms);
    let line = checkLineInDirectionSecond (foundRooms, beginColumn, beginIndex, currentPlayer, 1, 0);
    if (line.length >= 4) return line;
    
    line = checkLineInDirectionSecond (foundRooms, beginColumn, beginIndex, currentPlayer, 1, 1);
    if (line.length >= 4) return line;
    
    line = checkLineInDirectionSecond (foundRooms, beginColumn, beginIndex, currentPlayer, 0, 1);
    if (line.length >= 4) return line;
    
    line = checkLineInDirectionSecond (foundRooms, beginColumn, beginIndex, currentPlayer, -1, 1);
    return line;
  }

  checkLineInDirectionSecond = (foundRooms, beginColumn, beginIndex, currentPlayer, dC, dI) => {
    console.log("checkLineInDirectionSecond");
    let maxColumn = foundRooms.field.length - 1;
    let maxIndex = foundRooms.field[0].length -1;
    let isForward = true; // флаг - можем ли мы двигаться по фишкам в заданном в параметрах функции направлении
    let isReverse = true; // аналогичный флаг - только показывает можем ли мы двигаться в обратном направлении
    const line = [ {column: beginColumn, index: beginIndex} ] // изначально в линии-пбедительнице только одна фишка, с которой и начинаем
    let iteratorForward = 1; // итератор движения вперед
    let iteratorReverse = -1; // итератор движения назад
  
    while (isForward || isReverse) {
      if (isForward) { // если можем идти в прямом направлении
        let nextColumn = beginColumn + dC * iteratorForward; // следующая колонка
        let nextIndex = beginIndex + dI * iteratorForward; // следующий индекс в колонке
          if ( nextColumn >= 0 && nextColumn <= maxColumn && nextIndex >= 0 && nextIndex <= maxIndex ) { // если новые индексы на этой итерации не выходят за границы массива
            if ( foundRooms.field[nextColumn][nextIndex] === currentPlayer ) { // если новая фишка того же цвета
              line.push( {column: nextColumn, index: nextIndex} ); // добавляем эту фишку в массив линии
              iteratorForward++; // увеличиваем итератор
            } else isForward = false;
          } else isForward = false;
      }
  
      if (isReverse) { // аналогично, только с отрицательным итератором
        let nextColumn = beginColumn + dC * iteratorReverse;
        let nextIndex = beginIndex + dI * iteratorReverse;
          if ( nextColumn >= 0 && nextColumn <= maxColumn && nextIndex >= 0 && nextIndex <= maxIndex ) {
            if ( foundRooms.field[nextColumn][nextIndex] === currentPlayer ) {
              line.push( {column: nextColumn, index: nextIndex} );
              iteratorReverse--;
            } else isReverse = false;
          } else isReverse = false;
      }
    }
  
    return line;
  }









































// tests *************************************
app.post("/test", function(req, res){
    console.log("Попали в тест на сервере: ", req.body.roomID);
    console.log ( deleteRoomByID(req.body.roomID) );
    console.log ( rooms );

    // let resfind = findRoomByID(req.body.roomID);
    // console.log( resfind );
    // res.send( {room: resfind} );
});