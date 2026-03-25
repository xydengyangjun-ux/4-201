import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, Wifi, Bell, Settings, HardDrive, FileSpreadsheet, Lock, User, CheckCircle2, XCircle, Send, HelpCircle, RefreshCw, Smartphone, Database, X, Maximize2, Minus, ChevronRight, Chrome, GraduationCap, Eye, EyeOff } from 'lucide-react';

type Phase = 0 | 1 | 2 | 3 | 4 | 5;
type TaskId = 'network' | 'update' | 'antivirus' | 'autologin' | 'twofactor' | 'backup' | 'password' | 'sharing' | 'access';
type WindowId = 'none' | 'wifi' | 'update' | 'cloud' | 'excel' | 'settings' | 'crisis' | 'qq' | 'security_prompt';

const TASK_NAMES: Record<TaskId, string> = {
  network: '安全网络',
  update: '更新系统',
  antivirus: '杀毒软件',
  autologin: '慎用自动登录',
  twofactor: '双重认证',
  backup: '定期备份',
  password: '强密码',
  sharing: '慎重分享个人信息',
  access: '限制访问权限'
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const WindowWrapper = ({ id, activeWindow, closeWindow, title, icon: Icon, children, width = 'w-96' }: any) => {
  if (activeWindow !== id) return null;
  return (
    <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col border border-gray-300 ${width} z-50`}>
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300 select-none">
        <div className="flex items-center space-x-2 text-gray-700">
          <Icon size={16} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex space-x-2">
          <button className="text-gray-500 hover:text-gray-700" onClick={() => closeWindow(id)}><Minus size={14} /></button>
          <button className="text-gray-500 hover:text-gray-700"><Maximize2 size={14} /></button>
          <button className="text-gray-500 hover:text-red-500" onClick={() => closeWindow(id)}><X size={14} /></button>
        </div>
      </div>
      <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [phase, setPhase] = useState<Phase>(0);
  const [activeWindow, setActiveWindow] = useState<WindowId>('none');
  const [showAI, setShowAI] = useState(false);
  const [qaStep, setQaStep] = useState(0);
  const [qaInput, setQaInput] = useState('');
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [tasks, setTasks] = useState<Record<TaskId, boolean>>({
    network: false,
    update: false,
    antivirus: false,
    autologin: false,
    twofactor: false,
    backup: false,
    password: false,
    sharing: false,
    access: false
  });

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: '你好！我是你的信息科技课AI助教。今天我们将进行《班级春游数据安全》项目。请先观察模拟的社交群聊，看看老师发了什么任务。'
  }]);

  const deepSeekChat = async (messages: { role: string; content: string }[], systemInstruction?: string) => {
    const payload = {
      model: 'deepseek-chat',
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        ...messages
      ],
      stream: false
    };

    console.log('deepSeekChat payload:', payload);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('deepSeekChat response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('deepSeekChat error data:', errorData);
        const errorMsg = errorData.error?.message || errorData.message || `API error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('deepSeekChat data received');
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        console.error('Unexpected DeepSeek response format:', data);
        throw new Error('API 返回了非预期的格式。');
      }
    } catch (error) {
      console.error('DeepSeek error:', error);
      const message = error instanceof Error ? error.message : String(error);
      return `抱歉，我遇到了一点网络问题，请重试。详细错误: ${message}`;
    }
  };

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [showReadButton, setShowReadButton] = useState(false);
  const [notification, setNotification] = useState<{ title: string; message: string; icon: any } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Phase 1 State
  const [tableData, setTableData] = useState([
    { id: 1, name: '张小明', idCard: '11010520140312451X', address: '北京市朝阳区阳光家园1号楼201' },
    { id: 2, name: '李思琪', idCard: '310104201407221023', address: '上海市徐汇区宛平南路600号' },
    { id: 3, name: '王子涵', idCard: '440305201411053312', address: '深圳市南山区科技园高新南一道' },
    { id: 4, name: '陈嘉宇', idCard: '330106201401182234', address: '杭州市西湖区文一西路998号' },
    { id: 5, name: '刘梓萱', idCard: '510107201409305521', address: '成都市武侯区天府大道北段1700号' },
    { id: 6, name: '杨浩然', idCard: '42010620140514661X', address: '武汉市武昌区中北路108号' },
    { id: 7, name: '赵梦婷', idCard: '320102201412087725', address: '南京市玄武区中山东路321号' },
    { id: 8, name: '黄宇轩', idCard: '500103201408198813', address: '重庆市渝中区解放碑步行街' },
    { id: 9, name: '周芷若', idCard: '61010420140228992X', address: '西安市雁塔区长安南路250号' },
    { id: 10, name: '吴浩宇', idCard: '350203201406061132', address: '厦门市思明区鹭江道12号' },
  ]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  
  // Initial choices tracking
  const [initialWifiChoice, setInitialWifiChoice] = useState<'free' | 'school' | 'none'>('none');
  const [initialUpdateChoice, setInitialUpdateChoice] = useState<'updated' | 'skipped' | 'none'>('none');
  
  // Phase 3 State
  const [wifiConnected, setWifiConnected] = useState<'free' | 'school' | 'none'>('free');
  const [wifiPassword, setWifiPassword] = useState('');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'security' | 'account' | 'backup'>('security');
  const [cloudAutoLogin, setCloudAutoLogin] = useState(true);
  const [excelPassword, setExcelPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEncryptModal, setShowEncryptModal] = useState(false);

  // Phase 5: Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [aiQuizInput, setAiQuizInput] = useState('');
  const [aiQuizFeedback, setAiQuizFeedback] = useState('');
  const [isAiQuizEvaluating, setIsAiQuizEvaluating] = useState(false);

  const QUIZ_QUESTIONS = [
    {
      q: "1. 什么是强密码的最佳特征？",
      options: ["只有数字，方便记忆", "包含大小写字母、数字和符号，且长度足够", "使用自己的生日或姓名", "所有账号都用同一个密码"],
      a: 1
    },
    {
      q: "2. 为什么要开启双重认证（2FA）？",
      options: ["为了让登录过程更繁琐", "即使密码泄露，黑客也难以登录你的账号", "为了节省手机流量", "为了让系统运行更快"],
      a: 1
    },
    {
      q: "3. 公共免密WiFi的主要安全风险是什么？",
      options: ["网速太慢", "手机容易没电", "数据传输不加密，容易被黑客监听窃取", "会消耗大量话费"],
      a: 2
    },
    {
      q: "4. 为什么要定期更新操作系统和软件？",
      options: ["为了获得更好看的图标", "为了清理电脑里的垃圾文件", "为了修复已知的安全漏洞，防止黑客攻击", "为了让电脑变得更重"],
      a: 2
    },
    {
      q: "5. 杀毒软件的主要作用是什么？",
      options: ["提高打字速度", "实时监控并拦截病毒和恶意软件", "美化桌面壁纸", "自动帮我写作业"],
      a: 1
    },
    {
      q: "6. 定期备份数据是为了应对什么情况？",
      options: ["防止数据丢失（如硬件损坏、勒索病毒）", "为了腾出电脑空间", "为了让数据变得更值钱", "为了让数据更好看"],
      a: 0
    },
    {
      q: "7. 在在线文档中处理身份证号等敏感信息，最安全的做法是？",
      options: ["直接原样输入", "开启隐私保护模式进行脱敏处理（如显示为1101****）", "把字体颜色改成白色", "把字体缩小到看不见"],
      a: 1
    },
    {
      q: "8. 开启‘自动登录’或‘记住密码’的风险是？",
      options: ["账号会变得更难找", "如果设备丢失，他人可以直接进入你的账号", "会导致网络断开", "会让密码过期更快"],
      a: 1
    },
    {
      q: "9. 限制文档的访问权限（如‘仅查看’或‘保护区域’）是为了？",
      options: ["防止他人恶意篡改或删除重要数据", "为了不让别人看到内容", "为了节省服务器空间", "为了让文档加载更快"],
      a: 0
    }
  ];

  const handleAiQuizEvaluate = async () => {
    if (!aiQuizInput.trim() || isAiQuizEvaluating) return;
    setIsAiQuizEvaluating(true);
    try {
      const systemInstruction = `你是一位信息安全导师。现在正在对一名四年级学生进行结项考核。
学生对本节课的总结是：${aiQuizInput}

请根据学生的总结给出评价。
要求：
1. 评价要客观、专业且鼓励。
2. 判断学生是否真正掌握了数据安全的核心概念（如：多重防护、隐私保护、预防为主）。
3. 如果总结得好，给予高度评价并宣布其通过考核。
4. 字数控制在100字以内。`;
      const reply = await deepSeekChat([{ role: 'user', content: aiQuizInput }], systemInstruction);
      setAiQuizFeedback(reply);
    } catch (error) {
      console.error('handleAiQuizEvaluate error:', error);
      const msg = error instanceof Error ? error.message : '未知错误';
      setAiQuizFeedback(`评价生成失败: ${msg}`);
    } finally {
      setIsAiQuizEvaluating(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const introStarted = useRef(false);
  useEffect(() => {
    if (!introFinished && phase === 0 && !introStarted.current) {
      introStarted.current = true;
      // Start with WiFi selection
      setActiveWindow('wifi');
    }
    if (phase === 3) {
      const allDone = Object.values(tasks).every(Boolean);
      if (allDone) {
        setPhase(5); // Go to Quiz Phase
      }
    }
  }, [tasks, phase, introFinished]);

  const handleSendMessage = async (text: string = chatInput) => {
    if (!text.trim()) return;
    console.log('Sending message:', text);
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(newHistory);
    setChatInput('');
    setIsTyping(true);

    try {
      console.log('Calling deepSeekChat...');
      const systemInstruction = '你是信息科技课的AI助教。四年级学生正在进行《班级春游数据安全》项目。当学生问“为什么会这样”时，请先温和地指出他们在刚才的操作中犯了哪些错误（如：连接了公共免密WiFi、在公开共享的在线文档中直接输入了身份证和家庭住址等隐私信息、没有开启隐私保护等），导致了数据泄露。然后，引导他们结合教材知识，思考如何应用以下9个妙招：定期备份、强密码、杀毒软件、慎用自动登录、双重认证、限制访问权限、更新系统、安全网络、慎重分享个人信息。不要直接给答案，而是启发他们去左侧的‘虚拟系统’中寻找相应的设置进行修复。语气要像一位和蔼的老师。';
      const messages = newHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      const reply = await deepSeekChat(messages, systemInstruction);
      console.log('Received reply:', reply);
      
      setChatHistory([...newHistory, { role: 'assistant', content: reply }]);
      
      if (phase === 2) {
        setPhase(3);
        setActiveWindow('none');
      }
    } catch (error) {
      console.error('handleSendMessage error:', error);
      // deepSeekChat already handles errors by returning a string, 
      // but if something else fails:
      const msg = error instanceof Error ? error.message : '未知错误';
      setChatHistory([...newHistory, { role: 'assistant', content: `系统错误: ${msg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const triggerCrisis = () => {
    setPhase(2);
    setActiveWindow('crisis');
  };

  const handleWarningFeedback = async () => {
    if (!qaInput.trim() || isGeneratingFeedback) return;
    
    setIsGeneratingFeedback(true);
    const wifiText = initialWifiChoice === 'free' 
      ? "你刚才尝试连接一个公共免密WiFi。这可能导致你的上网行为被监听，账号密码被窃取。"
      : "虽然你刚才选择了安全的WiFi，但如果是在公共场所，你该如何保持警惕？";
      
    const updateText = initialUpdateChoice === 'updated'
      ? "你刚才及时安装了系统更新，这是一个非常好的习惯。你知道如果不更新会有什么后果吗？"
      : "你刚才忽略了系统更新提示。如果黑客利用已知的安全漏洞远程控制你的电脑，你该怎么办？";

    const currentQuestion = [
      wifiText + " 你该怎么做？",
      updateText + " 你认为该如何处理？",
      "发现班级春游收集表无密码保护，所有人获得链接都可以进入查看 and 编辑，存在数据安全隐患。你该如何处理？",
      "春游收集表没有对敏感数据进行隐私保护，导致隐私数据泄漏（例如：身份证号、手机号、家庭住址等直接显示）。你认为该如何改进？"
    ][qaStep];

    try {
      const systemInstruction = `你是一位专业的信息安全导师。现在正在对一名四年级学生进行安全预警提示。
提示场景：${currentQuestion}
学生的处理方式：${qaInput}

请根据学生的处理方式给出点评。
要求：
1. 语气要专业且鼓励。
2. 如果学生处理得当，给予肯定并补充深度知识。
3. 如果学生处理不当或有疏漏，委婉指出并解释原因。
4. 最后必须提供一个简短的【危险案例】（50字以内），说明如果不注意这一点会发生什么真实危害。
5. 字数控制在150字以内。`;

      const reply = await deepSeekChat([{ role: 'user', content: qaInput }], systemInstruction);
      
      setChatHistory(prev => [...prev, 
        { role: 'user', content: qaInput },
        { role: 'assistant', content: reply }
      ]);

      setShowReadButton(true);
    } catch (error) {
      console.error('Warning feedback error:', error);
      const msg = error instanceof Error ? error.message : '未知错误';
      setChatHistory(prev => [...prev, { role: 'assistant', content: `导师连接中断: ${msg}` }]);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleReadFeedback = () => {
    if (qaStep < 3) {
      setQaStep(prev => prev + 1);
      setQaInput('');
      setShowReadButton(false);
    } else {
      // Final step
      setPhase(3);
      setChecklistVisible(true);
      setShowAI(true);
      setActiveWindow('none');
      setShowReadButton(false);
    }
  };

  const closeWindow = (id: WindowId) => {
    setActiveWindow('none');
    if (!introFinished) {
      if (id === 'wifi') {
        setTimeout(() => setActiveWindow('update'), 500);
      } else if (id === 'update') {
        setIntroFinished(true);
        setTimeout(() => setActiveWindow('qq'), 500);
      }
    }
  };

  const completeTask = (task: TaskId) => {
    if (phase !== 3) return;
    setTasks(prev => ({ ...prev, [task]: true }));
  };

  return (
    <div className="flex h-screen w-full bg-gray-900 font-sans overflow-hidden">
      {/* Left Area: Virtual Desktop */}
      <div className={`${showAI ? 'w-3/4' : 'w-full'} h-full relative flex flex-col bg-slate-800 transition-all duration-300`}>
        
        {/* AI Icon in Top Right */}
        <div className="absolute top-4 right-4 z-[100]">
          <button 
            onClick={() => setShowAI(!showAI)}
            className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 ${showAI ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
          >
            <Shield size={24} />
          </button>
        </div>

        {/* Windows */}
        
        {/* Phase 0: QQ Group Chat */}
        <WindowWrapper id="qq" activeWindow={activeWindow} closeWindow={closeWindow} title="QQ - 四年级1班 班级群" icon={Smartphone} width="w-[400px]">
          <div className="h-[500px] flex flex-col bg-[#ebebeb] -m-6">
            {/* Chat Content */}
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
              <div className="text-center">
                <span className="text-[10px] bg-gray-300/50 text-gray-500 px-2 py-0.5 rounded">昨天 18:30</span>
              </div>

              {/* Teacher Message */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center text-white font-bold shrink-0">王</div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500">王老师 (班主任)</p>
                  <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm text-sm relative">
                    <div className="absolute -left-2 top-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-white"></div>
                    同学们，我们要去春游了！请大家点击下面的链接，在在线文档中登记身份证号和家庭住址，以便学校统一购买保险和安排车辆。
                  </div>
                  <div 
                    onClick={() => {
                      setPhase(1);
                      setActiveWindow('excel');
                      setChatHistory(prev => [...prev, {
                        role: 'assistant',
                        content: '你已经打开了春游信息收集表。请注意，这是一个公开共享的文档。在输入信息前，请先检查你的网络环境和系统设置是否安全。'
                      }]);
                    }}
                    className="mt-2 bg-white p-3 rounded-lg border border-blue-200 shadow-sm flex items-center space-x-3 cursor-pointer hover:bg-blue-50 transition-colors group"
                  >
                    <div className="bg-green-100 p-2 rounded group-hover:bg-green-200">
                      <FileSpreadsheet className="text-green-600" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-600 truncate">班级春游信息收集表.xlsx</p>
                      <p className="text-[10px] text-gray-400">腾讯文档 · 在线编辑</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span className="text-[10px] bg-gray-300/50 text-gray-500 px-2 py-0.5 rounded">刚刚</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center text-white font-bold shrink-0">张</div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500">张小明</p>
                  <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm text-sm">
                    收到！我这就去填。
                  </div>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-gray-200 flex items-center space-x-3">
              <div className="flex-1 bg-gray-100 rounded-full h-9 px-4 flex items-center text-gray-400 text-sm">
                请输入消息...
              </div>
              <div className="text-blue-500">
                <Smartphone size={24} />
              </div>
            </div>
          </div>
        </WindowWrapper>
        <div className="flex-1 p-4 flex flex-col gap-4 items-start relative">
          {/* Notification Overlay (Windows-style Toast) */}
          {notification && (
            <div className="absolute bottom-4 right-4 z-[200] animate-in slide-in-from-right duration-500">
              <div className="bg-[#1f1f1f]/90 backdrop-blur-lg border border-white/10 rounded-lg shadow-2xl p-4 flex items-center space-x-4 w-80 text-white">
                <div className="bg-blue-600/20 p-2 rounded">
                  <notification.icon className="text-blue-400" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">{notification.title}</p>
                  <p className="text-sm text-gray-100 font-medium leading-tight">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          <button 
            onDoubleClick={() => setActiveWindow('qq')}
            className="flex flex-col items-center group w-20"
          >
            <div className="w-12 h-12 bg-blue-400/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-400/30 transition-colors">
              <Smartphone size={28} />
            </div>
            <span className="text-white text-[10px] mt-1 shadow-sm">QQ</span>
          </button>
          
          <button 
            onDoubleClick={() => setActiveWindow('settings')}
            className="flex flex-col items-center p-2 rounded hover:bg-white/20 text-white w-24 group"
          >
            <Settings size={40} className="mb-1 drop-shadow-md text-gray-300 group-hover:text-white" />
            <span className="text-xs text-center drop-shadow-md">系统设置</span>
          </button>

          {(phase === 1 || phase === 3) && (
            <button 
              onDoubleClick={() => setActiveWindow('excel')}
              className="flex flex-col items-center p-2 rounded hover:bg-white/20 text-white w-24 group"
            >
              <Chrome size={40} className="mb-1 drop-shadow-md text-blue-400 group-hover:text-blue-300" />
              <span className="text-xs text-center drop-shadow-md">Chrome浏览器</span>
            </button>
          )}
        </div>

        {/* Phase 3 Checklist on Desktop (Bottom Left) */}
        {checklistVisible && (
          <div className="absolute bottom-16 left-4 w-72 bg-white/95 backdrop-blur rounded-lg shadow-xl border border-gray-200 overflow-hidden z-30">
            <div className="p-3 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center"><ShieldCheck size={16} className="mr-1" /> 安全加固清单</h3>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                {Object.values(tasks).filter(Boolean).length} / 9
              </span>
            </div>
            <div className="p-3 space-y-2 max-h-[40vh] overflow-y-auto">
              {Object.entries(TASK_NAMES).map(([key, name]) => (
                <div 
                  key={key} 
                  className="flex items-center text-sm cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                  onClick={() => {
                    const guidance: Record<TaskId, string> = {
                      network: '操作引导：请点击右下角WiFi图标，选择“School_Secure”并输入密码连接安全网络。\n防护理由：公共免费WiFi不加密，黑客可以轻易通过“中间人攻击”窃取你的上网数据。',
                      update: '操作引导：请点击右下角通知图标，在弹出的窗口中点击“立即更新”。\n防护理由：系统更新通常包含安全补丁，修复黑客可能利用的软件漏洞。',
                      antivirus: '操作引导：在“系统安全控制中心”的“病毒防护”选项卡中开启“实时病毒防护”。\n防护理由：杀毒软件能实时监控并拦截恶意代码，防止病毒破坏系统。',
                      autologin: '操作引导：在“账号安全设置”中关闭“自动登录/记住密码”。\n防护理由：自动登录虽然方便，但如果设备丢失或被他人接触，账号会直接暴露。',
                      twofactor: '操作引导：在“账号安全设置”中点击“立即开启”双重认证并绑定手机。\n防护理由：即使密码泄露，黑客也无法通过第二层身份验证（如短信验证码）。',
                      backup: '操作引导：在“数据备份”选项卡中开启“每日自动备份”。\n防护理由：备份是数据安全的最后防线，能防止因硬件损坏或勒索软件导致的数据丢失。',
                      password: '操作引导：在在线文档工具栏点击“文件加密”，设置包含字母和数字的强密码。\n防护理由：强密码增加了黑客暴力破解的难度，文件加密确保即使文件被下载也无法查看内容。',
                      sharing: '操作引导：在在线文档工具栏点击“开启隐私内容保护”。\n防护理由：隐私保护模式能自动遮蔽身份证号等敏感信息，防止被他人窥视或截图。',
                      access: '操作引导：在在线文档工具栏点击“保护所选区域”。\n防护理由：限制编辑权限可以防止他人恶意篡改或删除你的重要数据。'
                    };
                    setChatHistory(prev => [...prev, { role: 'assistant', content: guidance[key as TaskId] }]);
                    setShowAI(true);
                  }}
                >
                  {tasks[key as TaskId] ? (
                    <CheckCircle2 size={16} className="text-green-500 mr-2 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-2 shrink-0"></div>
                  )}
                  <span className={tasks[key as TaskId] ? 'text-gray-500 line-through' : 'text-gray-700'}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Windows */}
        
        {/* Phase 1: WiFi Selection */}
        <WindowWrapper id="wifi" activeWindow={activeWindow} closeWindow={closeWindow} title="网络连接" icon={Wifi}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">请选择要连接的无线网络：</p>
            <button 
              onClick={() => {
                setWifiConnected('free');
                if (!introFinished) {
                  setInitialWifiChoice('free');
                  closeWindow('wifi');
                } else if (phase === 1) {
                  setActiveWindow('update');
                }
              }}
              className={`w-full text-left p-3 rounded border ${wifiConnected === 'free' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-100'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">Free_Public_WiFi</span>
                {wifiConnected === 'free' && <span className="text-xs text-blue-600">已连接</span>}
              </div>
              <span className="text-xs text-red-500">开放网络 (无密码)</span>
            </button>
            <button 
              onClick={() => {
                if (wifiConnected === 'school') return;
                
                if (introFinished || phase >= 1) {
                  const pwd = prompt('请输入 School_Secure 的密码:');
                  if (pwd === '123456' || pwd === 'admin') {
                    setWifiConnected('school');
                    if (phase === 3) completeTask('network');
                  } else if (pwd !== null) {
                    alert('密码错误！提示：试试 123456');
                  }
                } else {
                  setWifiConnected('school');
                  setInitialWifiChoice('school');
                  closeWindow('wifi');
                }
              }}
              className={`w-full text-left p-3 rounded border ${wifiConnected === 'school' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-100'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">School_Secure</span>
                {wifiConnected === 'school' && <span className="text-xs text-blue-600">已连接</span>}
              </div>
              <span className="text-xs text-green-600">安全网络 (需要密码)</span>
            </button>
            {(phase === 3 || phase === 1) && wifiConnected !== 'none' && (
              <button onClick={() => setWifiConnected('none')} className="w-full mt-2 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">断开当前连接</button>
            )}
          </div>
        </WindowWrapper>

        {/* Phase 1 & 3: System Update */}
        <WindowWrapper id="update" activeWindow={activeWindow} closeWindow={closeWindow} title="系统更新提示" icon={Bell}>
          <div className="text-center space-y-4">
            <ShieldAlert size={48} className="mx-auto text-yellow-500" />
            <h3 className="text-lg font-medium">发现系统与应用新版本</h3>
            <p className="text-sm text-gray-600">包含重要的安全漏洞修复，建议立即更新。</p>
            
            {isUpdating ? (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${updateProgress}%` }}></div>
                <p className="text-xs text-gray-500 mt-2">正在更新... {updateProgress}%</p>
              </div>
            ) : (
              <div className="flex space-x-3 justify-center mt-6">
                <button 
                  onClick={() => {
                    if (!introFinished) setInitialUpdateChoice('skipped');
                    closeWindow('update');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
                >
                  忽略
                </button>
                <button 
                  onClick={() => {
                    if (!introFinished || phase === 3) {
                      if (!introFinished) setInitialUpdateChoice('updated');
                      setIsUpdating(true);
                      let p = 0;
                      const interval = setInterval(() => {
                        p += 20;
                        setUpdateProgress(p);
                        if (p >= 100) {
                          clearInterval(interval);
                          setIsUpdating(false);
                          if (phase === 3) completeTask('update');
                          
                          closeWindow('update');
                        }
                      }, 500);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  立即更新
                </button>
              </div>
            )}
          </div>
        </WindowWrapper>

        {/* Excel App (Browser) */}
        <WindowWrapper id="excel" activeWindow={activeWindow} closeWindow={closeWindow} title="Chrome - 春游报名表 - 在线协作文档" icon={Chrome} width="w-[800px]">
          <div className="flex flex-col h-full">
            {/* Browser Address Bar */}
            <div className="flex items-center space-x-2 mb-4 bg-gray-100 p-2 rounded text-sm text-gray-600">
              <Lock size={14} className="text-green-600" />
              <span className="truncate flex-1">https://docs.school.edu/spring-trip-registration</span>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowEncryptModal(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
                >
                  <Lock size={14} /> <span>文件加密</span>
                </button>
                <button 
                  onClick={() => completeTask('access')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
                >
                  <Shield size={14} /> <span>保护所选区域(防篡改)</span>
                </button>
                <button 
                  onClick={() => {
                    setIsPrivacyMode(!isPrivacyMode);
                    if (!isPrivacyMode) completeTask('sharing');
                  }}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm ${isPrivacyMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <User size={14} /> <span>{isPrivacyMode ? '关闭隐私保护' : '开启隐私内容保护'}</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-600 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span> 3人正在协作</span>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white text-[10px] text-white flex items-center justify-center">李</div>
                  <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white text-[10px] text-white flex items-center justify-center">王</div>
                  <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white text-[10px] text-white flex items-center justify-center">张</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded overflow-hidden flex-1 overflow-y-auto mb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-2 border-r w-16">序号</th>
                    <th className="px-4 py-2 border-r w-24">姓名</th>
                    <th className="px-4 py-2 border-r w-48">身份证号</th>
                    <th className="px-4 py-2">家庭住址</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 border-r text-gray-500">{row.id}</td>
                      <td className="px-4 py-2 border-r">{row.name}</td>
                      <td className="px-4 py-2 border-r font-mono text-xs text-gray-600">
                        {isPrivacyMode ? row.idCard.replace(/^(.{4})(?:\d+)(.{4})$/, '$1**********$2') : row.idCard}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {isPrivacyMode ? '***' : row.address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Action Area */}
            {phase === 1 && (
              <div className="flex justify-end">
                <button 
                  onClick={triggerCrisis}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm flex items-center"
                >
                  <Send size={16} className="mr-2" />
                  确认信息无误并提交
                </button>
              </div>
            )}

            {/* Encrypt Modal */}
            {showEncryptModal && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 animate-in zoom-in duration-200">
                  <div className="flex items-center space-x-2 mb-4 text-blue-600">
                    <Lock size={20} />
                    <h3 className="text-xl font-bold">设置文件加密密码</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">请输入新密码</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="例如: Abc@1234"
                          value={excelPassword}
                          onChange={e => setExcelPassword(e.target.value)}
                          className="w-full p-3 pr-10 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">强密码设置要求：</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li className="flex items-center">
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${excelPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          长度至少 8 位
                        </li>
                        <li className="flex items-center">
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/[A-Z]/.test(excelPassword) && /[a-z]/.test(excelPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          包含大小写字母
                        </li>
                        <li className="flex items-center">
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/[0-9]/.test(excelPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          包含数字
                        </li>
                        <li className="flex items-center">
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(excelPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          包含特殊符号 (如 @, #, $)
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button 
                        onClick={() => {
                          setExcelPassword('');
                          setShowPassword(false);
                          setShowEncryptModal(false);
                        }} 
                        className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={() => {
                          const isStrong = excelPassword.length >= 8 && 
                                          /[A-Z]/.test(excelPassword) && 
                                          /[a-z]/.test(excelPassword) && 
                                          /[0-9]/.test(excelPassword) && 
                                          /[!@#$%^&*(),.?":{}|<>]/.test(excelPassword);
                          
                          if (!isStrong) {
                            alert('密码强度不足！请确保满足所有强密码要求，以更好地保护你的文件。');
                          } else {
                            completeTask('password');
                            setShowPassword(false);
                            setShowEncryptModal(false);
                            setNotification({
                              title: '加密成功',
                              message: '文件已使用强密码加密，数据安全等级提升！',
                              icon: Lock
                            });
                          }
                        }}
                        className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                      >
                        确认加密
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </WindowWrapper>

        {/* System Settings */}
        <WindowWrapper id="settings" activeWindow={activeWindow} closeWindow={closeWindow} title="系统安全控制中心" icon={Settings} width="w-[500px]">
          <div className="flex h-[300px]">
            {/* Sidebar */}
            <div className="w-1/3 border-r pr-4 space-y-2">
              <button 
                onClick={() => setSettingsTab('security')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${settingsTab === 'security' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
              >
                <ShieldCheck size={16} className="inline mr-2" /> 病毒防护
              </button>
              <button 
                onClick={() => setSettingsTab('account')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${settingsTab === 'account' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
              >
                <User size={16} className="inline mr-2" /> 账号安全
              </button>
              <button 
                onClick={() => setSettingsTab('backup')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${settingsTab === 'backup' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
              >
                <Database size={16} className="inline mr-2" /> 数据备份
              </button>
            </div>
            
            {/* Content */}
            <div className="w-2/3 pl-6">
              {settingsTab === 'security' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">防火墙与病毒防护</h3>
                  <p className="text-sm text-gray-500">保护您的设备免受恶意软件和网络攻击。</p>
                  <div className="flex items-center justify-between p-4 border rounded bg-white">
                    <div className="flex items-center space-x-3">
                      <ShieldAlert className={tasks.antivirus ? "text-green-500" : "text-red-500"} />
                      <div>
                        <p className="text-sm font-medium">实时病毒防护</p>
                        <p className="text-xs text-gray-500">{tasks.antivirus ? '已开启' : '已关闭，设备存在风险'}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={tasks.antivirus} onChange={(e) => { if(e.target.checked) completeTask('antivirus'); else setTasks(p=>({...p, antivirus: false})) }} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {settingsTab === 'account' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">账号安全设置</h3>
                  <p className="text-sm text-gray-500">管理您的登录凭证和双重认证。</p>
                  
                  <div className="flex items-center justify-between p-4 border rounded bg-white">
                    <div className="flex items-center space-x-3">
                      <User className={!cloudAutoLogin ? "text-green-500" : "text-yellow-500"} />
                      <div>
                        <p className="text-sm font-medium">自动登录 / 记住密码</p>
                        <p className="text-xs text-gray-500">{cloudAutoLogin ? '已开启，存在被他人直接登录的风险' : '已关闭'}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={cloudAutoLogin} 
                        onChange={(e) => { 
                          setCloudAutoLogin(e.target.checked); 
                          if (!e.target.checked) completeTask('autologin'); 
                          else setTasks(p=>({...p, autologin: false}));
                        }} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded bg-white">
                    <div className="flex items-center space-x-3">
                      <Smartphone className={tasks.twofactor ? "text-green-500" : "text-gray-400"} />
                      <div>
                        <p className="text-sm font-medium">双重认证 (2FA)</p>
                        <p className="text-xs text-gray-500">{tasks.twofactor ? '已绑定手机号' : '未开启'}</p>
                      </div>
                    </div>
                    {!tasks.twofactor ? (
                      <button 
                        onClick={() => {
                          const phone = prompt('请输入手机号绑定双重认证:');
                          if (phone && phone.length >= 11) completeTask('twofactor');
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        立即开启
                      </button>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">已启用</span>
                    )}
                  </div>
                </div>
              )}

              {settingsTab === 'backup' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">自动备份</h3>
                  <p className="text-sm text-gray-500">定期将重要文件备份到安全的本地或云端存储。</p>
                  <div className="flex items-center justify-between p-4 border rounded bg-white">
                    <div className="flex items-center space-x-3">
                      <RefreshCw className={tasks.backup ? "text-green-500" : "text-gray-400"} />
                      <div>
                        <p className="text-sm font-medium">每日自动备份到本地硬盘</p>
                        <p className="text-xs text-gray-500">{tasks.backup ? '每天 02:00 自动执行' : '未开启'}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={tasks.backup} onChange={(e) => { if(e.target.checked) completeTask('backup'); else setTasks(p=>({...p, backup: false})) }} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </WindowWrapper>

        {/* Phase 2: Security Prompt Q&A */}
        {phase === 2 && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 md:p-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[800px] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-red-600 p-4 md:p-6 text-white flex items-center space-x-4">
                <ShieldAlert size={32} />
                <div>
                  <h2 className="text-xl font-bold">安全预警：发现潜在安全威胁！</h2>
                  <p className="text-sm opacity-90">请根据以下提示，判断并选择最安全的处理方式。</p>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Q&A Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
                  {qaStep === 0 && (
                    <div className="space-y-4">
                      <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                        <h3 className="font-bold text-base mb-1 text-red-800">危险提示1</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {initialWifiChoice === 'free' 
                            ? "你刚才尝试连接一个公共免密WiFi。这可能导致你的上网行为被监听，账号密码被窃取。你该怎么做？"
                            : "虽然你刚才选择了安全的WiFi，但如果是在公共场所，你该如何保持警惕？"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {(initialWifiChoice === 'free' 
                          ? ['立即断开，使用手机热点或加密网络', '继续使用，反正不花钱', '只要不登录银行账号就没事']
                          : ['时刻检查WiFi名称，不连接来源不明的信号', '只要有信号就连，省流量', '公共WiFi都一样安全']).map((opt, i) => (
                          <button 
                            key={i}
                            onClick={() => setQaInput(opt)}
                            className={`text-left p-2.5 rounded-lg border transition-all text-sm ${qaInput === opt ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {qaStep === 1 && (
                    <div className="space-y-4">
                      <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                        <h3 className="font-bold text-base mb-1 text-red-800">危险提示2</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {initialUpdateChoice === 'updated'
                            ? "你刚才及时安装了系统更新，这是一个非常好的习惯。你知道如果不更新会有什么后果吗？"
                            : "你刚才忽略了系统更新提示。如果黑客利用已知的安全漏洞远程控制你的电脑，你该怎么办？"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {(initialUpdateChoice === 'updated'
                          ? ['黑客可能利用未修复的漏洞窃取数据', '系统会变得越来越慢，但不影响安全', '没有任何后果，更新只是为了新功能']
                          : ['立即安装官方安全补丁', '点击‘稍后提醒’，等有空再说', '直接关闭提示，系统更新太麻烦']).map((opt, i) => (
                          <button 
                            key={i}
                            onClick={() => setQaInput(opt)}
                            className={`text-left p-2.5 rounded-lg border transition-all text-sm ${qaInput === opt ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {qaStep === 2 && (
                    <div className="space-y-4">
                      <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                        <h3 className="font-bold text-base mb-1 text-red-800">危险提示3</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">发现班级春游收集表无密码保护，所有人获得链接都可以进入查看和编辑，存在数据安全隐患。你该如何处理？</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {['立即联系老师，建议设置访问密码或权限控制', '不管它，反正大家都是同学，不会乱改的', '趁机修改别人的报名信息，开个小玩笑'].map((opt, i) => (
                          <button 
                            key={i}
                            onClick={() => setQaInput(opt)}
                            className={`text-left p-2.5 rounded-lg border transition-all text-sm ${qaInput === opt ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {qaStep === 3 && (
                    <div className="space-y-4">
                      <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                        <h3 className="font-bold text-base mb-1 text-red-800">危险提示4</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">春游收集表没有对敏感数据进行隐私保护，导致隐私数据泄漏（例如：身份证号、手机号、家庭住址等直接显示）。你认为该如何改进？</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {['对敏感信息进行脱敏处理（如：138****1234），并限制查看范围', '只要表格链接不发给外人，就不需要保护', '把所有人的信息都打印出来贴在教室门口，方便大家核对'].map((opt, i) => (
                          <button 
                            key={i}
                            onClick={() => setQaInput(opt)}
                            className={`text-left p-2.5 rounded-lg border transition-all text-sm ${qaInput === opt ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Box */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">或者输入你的见解：</p>
                    <textarea 
                      value={qaInput}
                      onChange={(e) => setQaInput(e.target.value)}
                      placeholder="请选择上方选项或在此输入..."
                      className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                    />
                  </div>
                </div>

                {/* AI Mentor Area */}
                <div className="w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col">
                  <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center space-x-2">
                    <Shield className="text-blue-600" size={18} />
                    <span className="font-bold text-blue-800 text-sm">AI 导师点评</span>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {chatHistory.filter(m => m.role === 'assistant').slice(-1).map((msg, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-xs leading-relaxed text-gray-800 italic">
                        {isGeneratingFeedback ? (
                          <div className="flex space-x-1 py-1">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        ) : (
                          <>“{msg.content}”</>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    {!showReadButton ? (
                      <button 
                        onClick={handleWarningFeedback}
                        disabled={!qaInput.trim() || isGeneratingFeedback}
                        className={`w-full py-3 rounded-xl font-bold text-base shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2 ${
                          !qaInput.trim() || isGeneratingFeedback
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
                        }`}
                      >
                        {isGeneratingFeedback ? (
                          <>
                            <RefreshCw className="animate-spin" size={18} />
                            <span className="text-sm">导师正在点评...</span>
                          </>
                        ) : (
                          <>
                            <span>提交反馈</span>
                            <Send size={18} />
                          </>
                        )}
                      </button>
                    ) : (
                      <button 
                        onClick={handleReadFeedback}
                        className="w-full py-3 rounded-xl font-bold text-base shadow-lg bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200 transition-all transform active:scale-95 flex items-center justify-center space-x-2 animate-in fade-in zoom-in duration-300"
                      >
                        <CheckCircle2 size={18} />
                        <span>已读，进入下一项</span>
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 5: Classroom Quiz */}
        {phase === 5 && (
          <div className="absolute inset-0 bg-blue-900 flex items-center justify-center z-[200] p-4 md:p-10">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-500">
              {/* Quiz Header */}
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <GraduationCap size={32} />
                  <div>
                    <h2 className="text-2xl font-bold">数据安全课堂结项测验</h2>
                    <p className="text-sm opacity-80">请完成以下 10 道题目，检验你的学习成果。</p>
                  </div>
                </div>
                <div className="bg-blue-500 px-4 py-2 rounded-full font-mono font-bold">
                  进度: {quizStep + 1} / 10
                </div>
              </div>

              {/* Quiz Content */}
              <div className="flex-1 p-8 overflow-y-auto">
                {quizStep < 9 ? (
                  <div className="space-y-8">
                    <div className="bg-blue-50 p-6 rounded-2xl border-l-8 border-blue-500">
                      <h3 className="text-xl font-bold text-blue-900 leading-relaxed">
                        {QUIZ_QUESTIONS[quizStep].q}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {QUIZ_QUESTIONS[quizStep].options.map((opt, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            if (i === QUIZ_QUESTIONS[quizStep].a) {
                              setQuizScore(s => s + 10);
                            }
                            setQuizStep(s => s + 1);
                          }}
                          className="group flex items-center p-5 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center font-bold mr-4 transition-colors">
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="text-lg text-gray-700 group-hover:text-blue-900">{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-purple-50 p-6 rounded-2xl border-l-8 border-purple-500">
                      <h3 className="text-xl font-bold text-purple-900 leading-relaxed">
                        10. AI 导师对话考核：请用一句话总结你今天学到的最重要的“数据安全妙招”及其原因。
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <textarea 
                        value={aiQuizInput}
                        onChange={(e) => setAiQuizInput(e.target.value)}
                        placeholder="在此输入你的总结..."
                        className="w-full h-40 p-6 border-2 border-gray-200 rounded-2xl text-lg focus:ring-4 focus:ring-purple-200 focus:border-purple-500 focus:outline-none transition-all"
                      />
                      
                      {aiQuizFeedback && (
                        <div className="bg-white p-6 rounded-2xl shadow-inner border-2 border-purple-100 animate-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center space-x-2 mb-2 text-purple-700 font-bold">
                            <Shield size={20} />
                            <span>导师点评</span>
                          </div>
                          <p className="text-gray-800 italic leading-relaxed">“{aiQuizFeedback}”</p>
                        </div>
                      )}

                      {!aiQuizFeedback ? (
                        <button 
                          onClick={handleAiQuizEvaluate}
                          disabled={!aiQuizInput.trim() || isAiQuizEvaluating}
                          className="w-full py-5 bg-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-purple-700 disabled:bg-gray-300 transition-all flex items-center justify-center space-x-3"
                        >
                          {isAiQuizEvaluating ? (
                            <>
                              <RefreshCw className="animate-spin" />
                              <span>导师正在阅卷...</span>
                            </>
                          ) : (
                            <>
                              <span>提交总结并完成考核</span>
                              <Send />
                            </>
                          )}
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setQuizScore(s => s + 10);
                            setPhase(4);
                          }}
                          className="w-full py-5 bg-green-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-green-700 transition-all flex items-center justify-center space-x-3"
                        >
                          <span>查看最终结项报告</span>
                          <ChevronRight />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quiz Footer */}
              <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                <div className="text-gray-500 font-medium">
                  当前得分: <span className="text-blue-600 font-bold">{quizScore}</span>
                </div>
                <div className="text-xs text-gray-400">
                  * 满分 100 分，包含 9 道选择题及 1 道 AI 综合评价题。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: Success Modal */}
        {phase === 4 && (
          <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg border-t-8 border-green-500 text-center">
              <ShieldCheck size={80} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-4">数据安全项目结项报告</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                恭喜你！你已熟练掌握保护数据的 9 个小妙招，成功保护了班级隐私数据，避免了社会工程学和网络攻击的威胁。
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                重新体验
              </button>
            </div>
          </div>
        )}

        {/* Taskbar */}
        <div className="absolute bottom-0 w-full h-12 bg-gray-800/90 backdrop-blur border-t border-gray-700 flex items-center justify-between px-4 z-40">
          <div className="flex items-center space-x-4">
            <button className="text-white hover:bg-white/10 p-2 rounded">
              <div className="w-5 h-5 bg-blue-500 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                <div className="bg-white rounded-sm"></div><div className="bg-white rounded-sm"></div>
                <div className="bg-white rounded-sm"></div><div className="bg-white rounded-sm"></div>
              </div>
            </button>
            {/* Open windows indicators could go here */}
          </div>
          <div className="flex items-center space-x-4 text-gray-300">
            {activeWindow !== 'qq' && (
              <button 
                onClick={() => setActiveWindow('qq')}
                className="hover:text-white hover:bg-white/10 p-1.5 rounded transition-colors"
                title="QQ"
              >
                <Smartphone size={18} className="text-blue-400" />
              </button>
            )}
            <button onClick={() => setActiveWindow('wifi')} className="hover:text-white hover:bg-white/10 p-1.5 rounded relative">
              <Wifi size={18} />
              {wifiConnected === 'free' && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            <button onClick={() => setActiveWindow('update')} className="hover:text-white hover:bg-white/10 p-1.5 rounded relative">
              <Bell size={18} />
              {phase === 1 && <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>}
            </button>
            <span className="text-sm">10:00 AM</span>
          </div>
        </div>
      </div>

      {/* Right Area: AI Assistant & Checklist (25%) */}
      {showAI && (
        <div className="w-1/4 h-full bg-white border-l border-gray-200 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center space-x-3 shrink-0">
            <div className="bg-white/20 p-2 rounded-lg">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">AI 数据安全顾问</h1>
              <p className="text-blue-100 text-xs">项目式学习助教</p>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-200 shrink-0">
            <div className="flex items-end space-x-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="向AI助教提问..."
                className="flex-1 border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-[60px]"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || isTyping}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 h-[60px] w-[60px] flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
