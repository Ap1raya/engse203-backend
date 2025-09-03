
const express = require('express');
const app = express();
const PORT = 3001;
/*
AVAILABLE  = พร้อมรับสาย
ACTIVE     = กำลังคุยกับลูกค้า  
WRAP_UP    = บันทึกหลังจบสาย
NOT_READY  = ไม่พร้อมรับสาย (พัก/ประชุม)
OFFLINE    = ออฟไลน์
*/


const agent = [{
    code: "A001",
    name: Noah,
    status: _____,
},
{
    const agent =
        code: "A001",        // รหัส Agent
    name: Liam,         // เติมคิดเอง
    status: _____,       // เติมคิดเอง  
    // คิดต่อว่าควรมีอะไรอีก...
},
{

const agent = 
    code: "A001",        // รหัส Agent
    name: Leo,         // เติมคิดเอง
    status: _____,       // เติมคิดเอง  
    // คิดต่อว่าควรมีอะไรอีก...
}
];

app.get('/hello', (req, res) => {


    res.sendStatus("สวัสดี ! ");
}); // // เติม method และ 

app.get('/health', (req, res) => {


    res.json(
        {
            "status": "OK",
            "timestamp": "เวลาปัจจุบัน"
        });

}); // // เติม method และ response function


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});