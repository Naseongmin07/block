const express = require('express')
const app = express()
const port = process.env.PORT || 3001
const bodyParser = require('body-parser')
const bc = require('./block.js')
const ws = require('./network.js')

app.use(bodyParser.json())


app.get("/blocks",(req,res)=>{
    res.send(bc.getBlocks())
})

app.get("/version",(req,res)=>{
    res.send(bc.getVersion())
})

// curl http://localhost:3000/mineBlock -X POST -H "Content-Type:application/json" -d "{\"data\": [\"Hello world\"]}"
app.post("/mineBlock",(req,res)=>{
    const data = req.body.data
    const result = bc.mineBlock(data) // {} or false
    if(result == null){
        res.send(`mineBlock failed`)
    }else{
        res.send(result)
    }
})

// express 클라리언트
// websocket 서버측
// peers -> 현재 가지고 있는 소켓 리스트 getsocket
// addpeers -> 내가 보낼 주소값에 소켓을 생성하는 작업 connectToPeers


app.get('/peers',(req,res)=>{
    res.send(ws.getSockets().map(socket=>{
        return `${socket._socket.remoteAddress}: ${socket._socket.remotePort}`;
    }))
})


// curl -X POST -H "Content-Type:application/json" -d "{\"peers\":[\"ws://localhost:7001\",\"ws://localhost:7002\"]}" http://localhost:3000/addPeers


app.post('/addPeers',(req,res)=>{
    const peers = req.body.peers || []
    ws.connectionToPeers(peers)
    res.send('success')
})

// curl http://localhost:3000/stop

app.get("/stop",(req,res)=>{
    res.send("server stop")
    process.exit(0)
})



ws.wsInit()
app.listen(port,()=>{
    console.log(`server start port ${port}`)
})

/*
set 변수명 = 값
set 변수명

mac or linux
export 변수명 = 값
env | grep 변수명
*/