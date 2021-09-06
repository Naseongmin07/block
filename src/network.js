// npm install ws

const WebSocket = require('ws')
const wsPORT = process.env.WS_PORT || 6005
const bc = require('./block.js')

// 전역변수 peer
let sockets = []
function getSockets(){
    return sockets
}

const MessageAction = {
    QUERY_LAST:0,
    QUERY_ALL:1,
    RESPONSE_BLOCK:2
}

function initMessageHandler(ws){
    ws.on("message",(data)=>{
        const message = JSON.parse(data)
        switch(message.type){
            case MessageAction.QUERY_LAST:
                write(ws, responseLastMsg())
            break;
            case MessageAction.QUERY_ALL:
                write(ws, responseBlockMsg())
            break;
            case MessageAction.RESPONSE_BLOCK:
                handleBlockResponse(message)
            break;
        }
    })
}
function queryAllMsg(){
    return {
        type: MessageAction.QUERY_ALL,
        data: null
    }
}

function queryBlockMsg(){
    return {
        type: MessageAction.QUERY_LAST,
        data: null
    }
}

function responseLastMsg(){
    return {
        type: MessageAction.RESPONSE_BLOCK,
        data: JSON.stringify([bc.getLastBlock()])
    }
}

function responseBlockMsg(){
    return {
        type: MessageAction.RESPONSE_BLOCK,
        data: JSON.stringify(bc.getBlocks)
    }
}

function handleBlockResponse(message){
    const receivedBlocks = JSON.parse(message.data)
    const lastBlockRecieved = receivedBlocks[receivedBlocks.length-1] // 받은 블록의 마지막
    const lastBlockHeld = bc.getLastBLock() // 가지고 있는 블록의 마지막
    // 블록 최신화 체크
    if(lastBlockRecieved.header.index > lastBlockHeld.header.index){
        console.log(
            "블록의 갯수 \n" +
            `내가 받은 블록의 index값 ${lastBlockRecieved.header.index}\n`+
            `내가 가지고 있는 블럭의 index값 ${lastBlockHeld.header.index}\n`
        )

        // 연결점 어느정도인가.
        if(bc.createHash(lastBlockHeld)===lastBlockRecieved.header.previousHash){
            console.log(`마지막 하나만 비어있는 경우에는 하나만 추가합니다.`)
            if(bc.addBlock(lastBlockRecieved)){
                broadcast(responseLastMsg())
            }
        }else if(receivedBlocks.length===1){
            console.log(`피어로부터 블록을 연결해야합니다.`)
            broadcast(queryAllMsg())
        }else {
            console.log(`블럭을 최신화를 진행합니다`)
            //블럭을 최신화하는 코드를 또 작성...
            bc.replaceBlock(receivedBlocks)
        }

    }else{
        console.log('블록이 이미 최신화입니다.')
    }
}



function initErrorHandler(ws){
    ws.on("close",()=>{closeConnection(ws)})
    ws.on("error",()=>{closeConnection(ws)})
}

function closeConnection(ws){
    console.log(`Connection close ${ws.url}`)
    sockets.splice(sockets.indexOf(ws),1)
}

// socket event javascript -> event ? async await

// 최초의 접속
function wsInit(){
    const server = new WebSocket.Server({ port: wsPORT })
    // server 내가 받은 6005 소켓
    // server.on("why",()=>{})
    // console.log('왜?')
    server.on("connection",(ws)=>{
        console.log('connect----------------------------------')
        console.log(ws)
        init(ws) // 소켓 키값
    })
}

function write(ws, message){ws.send(JSON.stringify(message))}


function broadcast(message){
    sockets.forEach(socket => {
        write(socket, message)
    })
}

function connectionToPeers(newPeers){
    newPeers.forEach(peer=>{ // ws://localhost:7001
        const ws = new WebSocket()
        ws.on("open",()=>{init(ws)})
        ws.on("error",()=>{console.log("connection failed")})
    })
}

function init(ws){

    sockets.push(ws)
    initMessageHandler(ws)
    initErrorHandler(ws)
    // ws.send(JSON.stringify({type: MessageAction.QUERY_LAST,data:null}))
    write(ws,queryBlockMsg())
}

module.exports = {
    wsInit,
    broadcast,
    connectionToPeers,
    responseLastMsg,
    getSockets
}

