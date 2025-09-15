// ขั้นที่ 1: Import Express
const express = require('express'); // เติมให้ถูก
// ขั้นที่ 2: สร้าง app  
const app = express(); // เติมให้ถูก
// ขั้นที่ 3: กำหนด PORT
const PORT = 3001;
const cors = require('cors');
app.use(cors());
// เพิ่มบรรทัดนี้ก่อน routes
app.use(express.json());
// ขั้นที่ 4: สร้าง route แรก
app.get('/', (req, res) => {
    res.send("Hello Agent Wallboard!");
}); // เติม method และ response function




app.get('/Hello', (req, res) => {
    res.send("Hello");
});


app.get('/health', (req, res) => {
    res.send({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});


/*
AVAILABLE  = พร้อมรับสาย
ACTIVE     = กำลังคุยกับลูกค้า  
WRAP_UP    = บันทึกหลังจบสาย
NOT_READY  = ไม่พร้อมรับสาย (พัก/ประชุม)
OFFLINE    = ออฟไลน์
*/

let agents = [
    {
        code: "A001",        // รหัส Agent
        name: "bas",         // เติมคิดเอง
        status: "ACTIVE",       // เติมคิดเอง  
        loginTime: new Date()
    }, {
        code: "A002",
        name: "bas1",
        status: "ACTIVE",
        loginTime: new Date()
    }, {
        code: "A003",
        name: "bas2",
        status: "AVAILABLE",
        loginTime: new Date()
    }
];

app.get('/api/agents', (req, res) => {
    // ควร return อะไร?
    res.json({
        success: true,     // เติม true/false
        data: agents,        // เติม agents หรือไม่?
        count: agents.length,       // เติมจำนวน agents
        timestamp: new Date().toISOString()   // เติมเวลาปัจจุบัน
    });
});

//Mini Challenge 2
app.get('/api/agents/count', (req, res) => {
    res.json({
        success: true,
        count: agents.length,
        timestamp: new Date().toISOString()
    });
});

//URL: http://localhost:3001/api/agents/A001/status
app.patch('/api/agents/:code/status', (req, res) => {
    // Step 1: ดึง agent code จาก URL
    const agentCode = req.params.code; // เติม

    // Step 2: ดึง status ใหม่จาก body
    const newStatus = req.body.status; // เติม

    console.log('Agent Code:', agentCode);
    console.log('New Status:', newStatus);


    // หา agent ในระบบ
    const agent = agents.find(a => a.code === agentCode);
    console.log('found agent:', agent);

    if (!agent) {
        return res.status(404).json({
            success: false,
            error: "Agent not found"
        });
    }


    // ตรวจสอบ valid statuses
    const validStatuses = ["Available", "Active", "Wrap Up", "Not Ready", "Offline"];

    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({
            success: false,
            error: "Invalid status",
            validStatuses: validStatuses
        });
    }


    // บันทึกสถานะเก่า
    const oldStatus = agent.status;
    // Step 7: เปลี่ยน status
    agent.status = newStatus;
    agent.lastStatusChange = new Date();
    //Mini Challenge 3
    console.log(`[${new Date().toISOString()}] Agent ${agentCode}: ${oldStatus} → ${newStatus}`);

    console.log('current agent :', agent);

    // Step 8: ส่ง response กลับ
    res.json({
        success: true,
        message: `Agent ${agentCode} status changed from ${oldStatus} to ${newStatus}`,
        data: agent
    });

});


app.get('/api/dashboard/stats', (req, res) => {
    // ขั้นที่ 1: นับจำนวนรวม
    const totalAgents = agents.length; // เติม

    // ขั้นที่ 2: นับ Available agents
    // ให้นักศึกษาเขียน active, wrapUp, notReady, offline เอง
    const available = agents.filter(a => a.status === "AVAILABLE").length;
    const active = agents.filter(a => a.status === "ACTIVE").length;
    const wrapUp = agents.filter(a => a.status === "WRAP_UP").length;
    const notReady = agents.filter(a => a.status === "NOT_READY").length;
    const offline = agents.filter(a => a.status === "OFFLINE").length;



    // ขั้นที่ 3: คำนวณเปอร์เซ็นต์  
    const calcPercent = (count) => totalAgents > 0 ? Math.round((count / totalAgents) * 100) : 0;


    // ส่งผลลัพธ์กลับ
    res.json({
        success: true,
        totalAgents,
        stats: {
            available: { count: available, percent: calcPercent(available) },
            active: { count: active, percent: calcPercent(active) },
            wrapUp: { count: wrapUp, percent: calcPercent(wrapUp) },
            notReady: { count: notReady, percent: calcPercent(notReady) },
            offline: { count: offline, percent: calcPercent(offline) },
        },
        timestamp: new Date().toISOString()
    });
});

// POST /api/agents/:code/login
app.post('/api/agents/:code/login', (req, res) => {
    const agentCode = req.params.code;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({
            success: false,
            error: "Missing 'name' in request body"
        });
    }
    let agent = agents.find(a => a.code === agentCode);

    if (!agent) {
        // สร้าง agent ใหม่
        agent = {
            code: agentCode,
            name: name,
            status: "AVAILABLE",
            loginTime: new Date(),
        };
        agents.push(agent);
    } else {
        // อัปเดต agent เดิม
        agent.name = name;
        agent.status = "AVAILABLE";
        agent.loginTime = new Date();
    }
    res.json({
        success: true,
        message: `Agent ${agentCode} logged in successfully`,
        data: agent
    });
});

// POST /api/agents/:code/logout
app.post('/api/agents/:code/logout', (req, res) => {
    const agentCode = req.params.code;
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) {
        return res.status(404).json({
            success: false,
            error: "Agent not found"
        });
    }
    // เปลี่ยนสถานะเป็น Offline และลบ loginTime
    agent.status = "OFFLINE";
    delete agent.loginTime;

    res.json({
        success: true,
        message: `Agent ${agentCode} logged out successfully`,
        data: agent
    });
});



// ขั้นที่ 5: เริ่ม server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});