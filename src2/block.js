const fs = require('fs')
const merkle = require('merkle')
const CryptoJs = require('crypto-js')
const SHA256 = require('crypto-js/sha256') 
const random = require('random')

// // 사용법
// const tree = merkle("sha256").sync([]) // tree 구조
// tree.root()

class BlockHeader {
    constructor(version, index, previousHash, time, merkleRoot){
        this.version = version
        this.index = index  // 포인트
        this.previousHash = previousHash // 마지막 블럭 -> header -> string연결 -> SHA256
        this.time = time
        this.merkleRoot = merkleRoot 
    }
}

class Block {
    constructor(header, body){
        this.header = header
        this.body = body
    }
}


function createGenesisBlock(){
    const version = getVersion() // 1.0.0
    const index = 0
    const time = getCurrentTime()
    const previousHash = '0'.repeat(64)
    const body = ['hello block']

    const tree = merkle('sha256').sync(body)
    const root = tree.root() || '0'.repeat(64)

    const header = new BlockHeader(version, index, previousHash, time, root)
    return new Block(header, body)
}

function replaceBlock(newBlocks){
    // newBlocks : 내가 받은 전체 배열 => 내가 받은 전체 블록들
    // 1. newBlocks 내용을 검증해야합니다
    // 2. 검증을 한번만 하지 않습니다.
    // 3. Blocks = newBlocks
    // 4. broadcast 날립니다.
    if(isValidBlock(newBlocks) && newBlocks.length>Blocks.length && random.boolean()){ /// ? 랜덤값 왜 넣는건가
        console.log(`Blocks 배열을 newBlocks 으로 교체합니다`)
        const nw = require('./network')
        Blocks = newBlocks
        nw.broadcast(nw.responseLastMsg())
    }   else{
        console.log(`메세지로부터 받은 블록 내용이 맞지 않습니다`)
    }
}


function getVersion(){
    const package = fs.readFileSync("../package.json")
    // console.log(package.toString("utf8"))
    return JSON.parse(package).version
}

function getCurrentTime(){
    const date = new Date
    return Math.ceil(date.getTime()/1000)
}

// class
// {header body} 1차 목표는 제네시스 블럭을 만드는것

const Blocks = [createGenesisBlock()]


function getLastBlock(){
    return Blocks[Blocks.length-1]
}

function getBlocks(){
    return Blocks
}

function nextBlock(data){
    const prevBlock = getLastBlock()
    const version = getVersion()
    const index = prevBlock.header.index+1
    const previousHash = createHash(prevBlock)
    const timestamp = getCurrentTime()


    const merkleTree = merkle("sha256").sync(data)
    const merkleRoot = merkleTree.root() || '0'.repeat(64)

    const header = new BlockHeader(version,index, previousHash, timestamp, merkleRoot)
    return new Block(header, data)
}

function createHash(block){
    const{version, index, previousHash, time, merkleRoot} = block.header
    const blockString = version+ index + previousHash + time + merkleRoot
    const Hash = CryptoJs.SHA256(blockString).toString()
    return Hash
}


function isValidNewBlock(currentBlock,previousBlock){
    if(!isValidType(currentBlock)){
        console.log(`invalid block structure ${JSON.stringify(currentBlock)}`)
        return false
    }
    if(previousBlock.header.index+1 != currentBlock.header.index){
        console.log(`invalid index`)
        return false
    }
    // previousHash 체크
    // 어떻게 만들었는가 ?
    // 해당블럭의 header의 내용을 글자로 합쳐서 SHA256 통해서 암호화
    // createsHash         previousHash
    // 제네시스 블럭 기준 -> 2번째 블럭
    if(createHash(previousBlock) !== currentBlock.header.previousHash){
        console.log(`invalid previousBlock`)
        return false
    }

    // Body check
    /*
        current.header.merkleRoot -> body [배열]
        current.body -> merkleTree root -> result
        굳이왜 ?..
        네트워크
        body... 내용이 없으면 안됩니다.
        current.body.length ! == 0 && currentBlock.body 가지고있는 murkleRoot !== currentBlock.header.murkleRoot
    */
    if(currentBlock.body.length === 0){
        console.log(`invalid length`)
        return false
    }

    if(( merkle("sha256").sync(currentBlock.body).root() != currentBlock.header.merkleRoot)){
        console.log(`invalid merkleRoot`)
        return false
    }

    return true
}

function isValidType(block){
    return (
    typeof block.header.version ==="string" &&//string
    typeof block.header.index ==="number" &&//number
    typeof block.header.previousHash==="string" &&//string
    typeof block.header.time==="number" &&//number
    typeof block.header.merkleRoot==="string" &&//string
    typeof block.body==="object"//object
    )
}

function addBlock(newBlock){
    if(isValidNewBlock(newBlock, getLastBlock())){
        Blocks.push(newBlock)
        return true
    }else{
        return false
    }
}

function mineBlock(blockData){
    const newBlock = nextBlock(blockData)
    if(addBlock(newBlock)){
        const nw = require('./network')
        nw.broadcast(nw.responseLastMsg())
        return newBlock
    }else{
        return null
    }
}


function isValidBlock(Blocks){
    if(JSON.stringify(Blocks[0]) !== JSON.stringify(createGenesisBlock())){
        console.log(`genesis error`)
        return false
    }

    let tempBlocks = [Blocks[0]]
    for( let i = 1; i< Blocks.length; i++){
        if(isValidNewBlock(Blocks[i],Blocks[i-1])){
            tempBlocks.push(Blocks[i])
        } else{
            return false
        }
    }
    return true
}

isValidBlock(Blocks)

module.exports = {
    getBlocks,
    getLastBlock,
    addBlock,
    getVersion,
    mineBlock,
    createHash,
}

// P2P SOCKET
// WEB SOCKET
// 채팅 SOCKET


//P2P
// -> WebSocket
    //-> 접속에 대한것만 ex) boradcast , to