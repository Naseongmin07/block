# 블록체인

                 연결 (p2p)   
- 네트워크 ( http socket )
- 데이터를 저장하는 코드
    -Hash sha253 -> JWT
    -단반향 암호화 -> 자리수 고정 a-> 64 암호화
                                abc -> 64 암호화

const block = {
    header:{
        version:"1.0.0,
        HashPrevBlock:0x00000000000,
        HashMerkleRoot:`SHA256`,
        timestamp:`시간`
        # bits:`작업증명`
        nonce:`난수`
    }
    body:["hello world!"]
}
