import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, Wifi, Bell, Settings, HardDrive, FileSpreadsheet, Lock, User, CheckCircle2, XCircle, Send, HelpCircle, RefreshCw, Smartphone, Database, X, Maximize2, Minus, ChevronRight, Chrome } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

type Phase = 1 | 2 | 3 | 4;
type TaskId = 'network' | 'update' | 'antivirus' | 'autologin' | 'twofactor' | 'backup' | 'password' | 'sharing' | 'access';
type WindowId = 'none' | 'wifi' | 'update' | 'cloud' | 'excel' | 'settings' | 'crisis';

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

export default function App() {
  const [phase, setPhase] = useState<Phase>(1);
  const [activeWindow, setActiveWindow] = useState<WindowId>('wifi');
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
    content: '你好！我是你的信息科技课AI助教。今天我们将进行《班级春游数据安全》项目。请先在左侧的电脑桌面上完成初始设置和信息登记。'
  }]);

  const aiRef = useRef<GoogleGenAI | null>(null);

  const getAI = () => {
    if (!aiRef.current) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('GEMINI_API_KEY is missing. AI features will not work.');
        return null;
      }
      aiRef.current = new GoogleGenAI({ apiKey });
    }
    return aiRef.current;
  };

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
  
  // Phase 3 State
  const [wifiConnected, setWifiConnected] = useState<'free' | 'school' | 'none'>('free');
  const [wifiPassword, setWifiPassword] = useState('');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'security' | 'account' | 'backup'>('security');
  const [cloudAutoLogin, setCloudAutoLogin] = useState(true);
  const [excelPassword, setExcelPassword] = useState('');
  const [showEncryptModal, setShowEncryptModal] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  useEffect(() => {
    if (phase === 3) {
      const allDone = Object.values(tasks).every(Boolean);
      if (allDone) {
        setPhase(4);
      }
    }
  }, [tasks, phase]);

  const handleSendMessage = async (text: string = chatInput) => {
    if (!text.trim()) return;
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(newHistory);
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = getAI();
      if (!ai) {
        setChatHistory([...newHistory, { role: 'assistant', content: 'AI 助教暂时不可用，请检查 API 密钥配置。' }]);
        setIsTyping(false);
        return;
      }
      const prompt = newHistory.map(m => `${m.role === 'user' ? '学生' : '助教'}: ${m.content}`).join('\n') + '\n助教:';
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: '你是信息科技课的AI助教。四年级学生正在进行《班级春游数据安全》项目。当学生问“为什么会这样”时，请先温和地指出他们在刚才的操作中犯了哪些错误（如：连接了公共免密WiFi、在公开共享的在线文档中直接输入了身份证和家庭住址等隐私信息、没有开启隐私保护等），导致了数据泄露。然后，引导他们结合教材知识，思考如何应用以下9个妙招：定期备份、强密码、杀毒软件、慎用自动登录、双重认证、限制访问权限、更新系统、安全网络、慎重分享个人信息。不要直接给答案，而是启发他们去左侧的‘虚拟系统’中寻找相应的设置进行修复。语气要像一位和蔼的老师。',
        }
      });
      
      const reply = response.text || '抱歉，我遇到了一点网络问题，请重试。';
      
      setChatHistory([...newHistory, { role: 'assistant', content: reply }]);
      
      if (phase === 2) {
        setPhase(3);
        setActiveWindow('none');
      }
    } catch (error) {
      setChatHistory([...newHistory, { role: 'assistant', content: '网络连接失败，请检查API密钥或网络状态。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const triggerCrisis = () => {
    setPhase(2);
    setActiveWindow('crisis');
  };

  const completeTask = (task: TaskId) => {
    if (phase !== 3) return;
    setTasks(prev => ({ ...prev, [task]: true }));
  };

  const WindowWrapper = ({ id, title, icon: Icon, children, width = 'w-96' }: any) => {
    if (activeWindow !== id) return null;
    return (
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col border border-gray-300 ${width} z-50`}>
        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300 select-none">
          <div className="flex items-center space-x-2 text-gray-700">
            <Icon size={16} />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex space-x-2">
            <button className="text-gray-500 hover:text-gray-700"><Minus size={14} /></button>
            <button className="text-gray-500 hover:text-gray-700"><Maximize2 size={14} /></button>
            <button className="text-gray-500 hover:text-red-500" onClick={() => setActiveWindow('none')}><X size={14} /></button>
          </div>
        </div>
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-gray-900 font-sans overflow-hidden">
      {/* Left Area: Virtual Desktop (75%) */}
      <div className="w-3/4 h-full relative flex flex-col bg-slate-800">
        
        {/* Desktop Icons */}
        <div className="flex-1 p-4 flex flex-col gap-4 items-start">
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

        {/* Phase 3 Checklist on Desktop */}
        {(phase === 3 || phase === 4) && (
          <div className="absolute top-4 right-4 w-72 bg-white/95 backdrop-blur rounded-lg shadow-xl border border-gray-200 overflow-hidden z-30">
            <div className="p-3 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center"><ShieldCheck size={16} className="mr-1" /> 安全加固清单</h3>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                {Object.values(tasks).filter(Boolean).length} / 9
              </span>
            </div>
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {Object.entries(TASK_NAMES).map(([key, name]) => (
                <div key={key} className="flex items-center text-sm">
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
        <WindowWrapper id="wifi" title="网络连接" icon={Wifi}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">请选择要连接的无线网络：</p>
            <button 
              onClick={() => {
                setWifiConnected('free');
                if (phase === 1) setActiveWindow('update');
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
                if (phase === 3) {
                  const pwd = prompt('请输入 School_Secure 的密码:');
                  if (pwd) {
                    setWifiConnected('school');
                    completeTask('network');
                  }
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
            {phase === 3 && wifiConnected === 'free' && (
              <button onClick={() => setWifiConnected('none')} className="w-full mt-2 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">断开当前连接</button>
            )}
          </div>
        </WindowWrapper>

        {/* Phase 1 & 3: System Update */}
        <WindowWrapper id="update" title="系统更新提示" icon={Bell}>
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
                    if (phase === 1) setActiveWindow('none');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
                >
                  忽略
                </button>
                <button 
                  onClick={() => {
                    if (phase === 3) {
                      setIsUpdating(true);
                      let p = 0;
                      const interval = setInterval(() => {
                        p += 20;
                        setUpdateProgress(p);
                        if (p >= 100) {
                          clearInterval(interval);
                          setIsUpdating(false);
                          completeTask('update');
                          setTimeout(() => setActiveWindow('none'), 1000);
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
        <WindowWrapper id="excel" title="Chrome - 春游报名表 - 在线协作文档" icon={Chrome} width="w-[800px]">
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
                <div className="bg-white p-6 rounded-lg shadow-xl w-80">
                  <h3 className="text-lg font-medium mb-4">设置文件密码</h3>
                  <input 
                    type="password" 
                    placeholder="请输入密码"
                    value={excelPassword}
                    onChange={e => setExcelPassword(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                  />
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowEncryptModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">取消</button>
                    <button 
                      onClick={() => {
                        if (/^[0-9]+$/.test(excelPassword)) {
                          alert('密码太弱！请使用字母和数字的组合。');
                        } else if (excelPassword.length > 0) {
                          completeTask('password');
                          setShowEncryptModal(false);
                          alert('密码设置成功！');
                        }
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      确定
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </WindowWrapper>

        {/* System Settings */}
        <WindowWrapper id="settings" title="系统安全控制中心" icon={Settings} width="w-[500px]">
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

        {/* Phase 2: Crisis Overlay */}
        {phase === 2 && (
          <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg border-t-8 border-red-600">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-red-100 p-4 rounded-full animate-pulse">
                  <AlertTriangle size={64} className="text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-red-700 mb-6">安全灾难发生！</h2>
              <div className="space-y-3 text-sm text-gray-700 bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="flex items-start"><XCircle size={16} className="text-red-500 mr-2 mt-0.5 shrink-0" /> 警告！连接不安全网络，数据被监听！</p>
                <p className="flex items-start"><XCircle size={16} className="text-red-500 mr-2 mt-0.5 shrink-0" /> 警告！系统漏洞未修复，遭恶意软件入侵！</p>
                <p className="flex items-start"><XCircle size={16} className="text-red-500 mr-2 mt-0.5 shrink-0" /> 警告！未限制访问权限，身份证号被匿名用户批量复制！</p>
                <p className="flex items-start"><XCircle size={16} className="text-red-500 mr-2 mt-0.5 shrink-0" /> 警告！未开启双重认证和防毒软件，云盘账号可能被盗用！</p>
              </div>
              <p className="mt-6 text-center font-medium text-gray-800">
                系统界面已被锁定。请立即向右侧 <span className="text-blue-600">AI 助教</span> 求助，获取【保护数据小妙招】来修复系统。
              </p>
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
      <div className="w-1/4 h-full bg-white border-l border-gray-200 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-50">
        
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
          {phase === 2 && (
            <button 
              onClick={() => handleSendMessage('为什么会发生数据泄露和系统警告？')}
              className="w-full mb-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center transition-colors"
            >
              <HelpCircle size={16} className="mr-1" /> 为什么会这样？一键求助
            </button>
          )}
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
    </div>
  );
}
