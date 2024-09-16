import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { create } from 'zustand';
import { useRootStore } from './Root'
import { useEffect, useState } from 'react'
import { useAboutStore } from '../App'


function NavButton({ to, name, icon }) {
    return (
        <NavLink className={({ isActive, isPending }) =>
            isPending
                ? ""
                : isActive
                    ? "bg-custom-hover text-custom-text-light transition-none"
                    : "hover:bg-custom-text hover:text-custom-stress/95 transition-none"
        }
            to={to}>
            {icon}{name}
        </NavLink>
    )

}

const useConfigStore = create(set => ({
    configSetting: {},
    configAlert: "",
    isLoading: false,
    setConfigSetting: (configSetting) => set({ configSetting }),
    updateConfigSetting: (path, value) => set((state) => {
        const newConfigSetting = JSON.parse(JSON.stringify(state.configSetting));
        let current = newConfigSetting;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        return { configSetting: newConfigSetting };
    }),
    setConfigAlert: (configAlert) => set({ configAlert }),
    setIsLoading: (isLoading) => set({ isLoading }),
}));

function Config() {
    const { config, setConfig, updateConfig } = useRootStore();
    const { configSetting, setConfigSetting, configAlert, updateConfigSetting } = useConfigStore();
    const keyToName = {
        cloudSync: "云同步",
    };
    useEffect(() => {
        setConfigSetting(config);
    }, [config]);
    function saveConfig() {
        if (configSetting.cloudSync.webdav.path.endsWith('/my-vnite')) {
            setConfig(configSetting);
        } else {
            setConfig(configSetting);
            updateConfig(['cloudSync', 'webdav', 'path'], config.cloudSync.webdav.path + '/my-vnite');
        }
    }
    function quit() {
        setConfigSetting(config);
        document.getElementById('setting').close();
    }
    return (

        <dialog id="setting" className="modal">
            <div className="w-1/2 max-w-full max-h-full p-0 h-5/6 modal-box">
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="absolute btn btn-sm btn-ghost right-2 top-2" onClick={quit}>✕</button>
                </form>


                <div className="flex flex-row w-full h-full">
                    <div className="flex flex-col h-full p-3 pt-4 w-52 bg-custom-stress shrink-0">
                        <div className="w-full grow">
                            <div className='pt-4 pb-3 pl-6 font-bold text-custom-blue-6'>VNITE 设置</div>
                            <ul className="w-full menu rounded-box text-custom-text">
                                <li className=''>
                                    <NavButton to={`./general`} name={'通用'} icon={<span className="icon-[icon-park-solid--computer] w-6 h-6"></span>} />
                                    <NavButton to={`./cloudSync`} name={'云同步'} icon={<span className="icon-[material-symbols-light--cloud] w-6 h-6"></span>} />
                                    <NavButton to={`./advanced`} name={'高级'} icon={<span className="icon-[mingcute--settings-2-line] w-6 h-6"></span>} />
                                    <NavButton to={`./about`} name={'关于'} icon={<span className="icon-[material-symbols-light--info] w-6 h-6"></span>} />
                                </li>
                            </ul>

                        </div>
                    </div>
                    <div className="grow">
                        <Routes>
                            <Route index element={<Navigate to='./general' />} />
                            <Route path={`/general`} element={<General />} />
                            <Route path={`/cloudSync/*`} element={<CloudSync />} />
                            <Route path={`/advanced`} element={<Advanced />} />
                            <Route path={`/about`} element={<About />} />
                        </Routes>
                        <div className='absolute flex flex-row gap-3 right-5 bottom-5'>
                            <button className="transition-all border-0 btn bg-custom-stress text-custom-text-light hover:brightness-125" onClick={saveConfig}>保存</button>
                            <button className="transition-all border-0 btn bg-custom-stress text-custom-text-light hover:brightness-125" onClick={quit}>取消</button>
                        </div>
                    </div>
                    {
                        configAlert &&
                        <div className="toast toast-center">
                            <div className="pr-0 alert bg-custom-blue-6">
                                <span className='text-custom-text-light'>{configAlert}</span>
                            </div>
                        </div>
                    }
                </div>


            </div>
        </dialog>
    );
}

function General() {
    const { config, updateConfig, isAutoStartEnabled, setIsAutoStartEnabled } = useRootStore();

    const handleToggle = async () => {
        const newState = !isAutoStartEnabled;
        await window.electron.ipcRenderer.invoke('set-auto-start', newState);
        setIsAutoStartEnabled(newState);
    };
    function modeConvert(mode) {
        switch (mode) {
            case true:
                return '最小化到托盘';
            case false:
                return '直接退出';
            default:
                return '直接退出';
        }
    }
    return (
        <div className='flex flex-col w-full h-full gap-5 pb-32 overflow-auto p-7 scrollbar-base bg-custom-modal'>
            <div className='text-2xl font-bold text-custom-text-light'>
                通用
            </div>
            <div className='flex flex-col gap-2'>
                <label className="p-0 cursor-pointer label">
                    <span className="text-sm font-semibold">开机自启动</span>
                    <input type="checkbox" className="toggle checked:bg-custom-text-light bg-custom-text checked:[--tglbg:theme(colors.custom.blue-6)] [--tglbg:theme(colors.custom.stress)] border-0 hover:brightness-125 checked:hover:brightness-100" checked={isAutoStartEnabled} onChange={handleToggle} />
                </label>
                <div className='m-0 divider'></div>
                <label className="flex p-0 label">
                    <span className="flex-grow text-sm font-semibold">关闭主面板</span>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="flex flex-row items-center justify-between gap-2 pr-1 mb-1 text-sm font-semibold border-0 w-36 hover:text-custom-text-light input-sm bg-custom-stress hover:brightness-125">
                            <div className="flex items-center gap-3">
                                <div>{modeConvert(config?.general?.quitToTray || '直接退出')}</div>
                            </div>
                            <span className="icon-[material-symbols-light--keyboard-arrow-down] w-6 h-6"></span>
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu bg-custom-dropdown rounded-box z-[1] w-auto p-2 shadow">
                            <li onClick={() => { updateConfig(['general', 'quitToTray'], false) }} className='hover:bg-custom-text hover:text-black'><a className='transition-none hover:text-black'>直接退出</a></li>
                            <li onClick={() => { updateConfig(['general', 'quitToTray'], true) }} className='hover:bg-custom-text hover:text-black'><a className='transition-none hover:text-black'>最小化到托盘</a></li>
                        </ul>
                    </div>
                </label>
            </div>
            <div>

            </div>
        </div>
    )
}

function Advanced() {
    const { configSetting, updateConfigSetting, setConfigAlert, isLoading, setIsLoading } = useConfigStore();
    const { updateConfig, config } = useRootStore();
    function selectLePath() {
        window.electron.ipcRenderer.invoke('open-le-dialog').then((path) => {
            if (path) {
                updateConfig(['advance', 'lePath'], path);
            }
        })
    }
    return (
        <div className='flex flex-col w-full h-full gap-5 pb-32 overflow-auto p-7 scrollbar-base bg-custom-modal'>
            <div className='text-2xl font-bold text-custom-text-light'>
                高级
            </div>
            <div className='flex flex-col gap-2'>
                <div className='pb-2 font-bold text-custom-text-light'>Locale Emulator</div>
                <div className='flex flex-row items-center justify-between gap-12'>
                    <span className='text-sm font-semibold'>LEProc路径</span>
                    <label className="flex items-center w-3/4 gap-2 border-0 input-sm input bg-custom-stress focus-within:outline-none hover:brightness-125 focus-within:border-0 focus-within:shadow-inner-sm focus-within:shadow-black focus-within:bg-custom-focus focus-within:text-custom-text-light/95 focus-within:hover:brightness-100">
                        <input type='text' placeholder='请绑定LEProc.exe' spellCheck='false' className='grow' value={config?.advance?.lePath} onChange={(e) => { updateConfig(['advance', 'lePath'], e.target.value) }} />
                        <span className="icon-[material-symbols-light--folder-open-outline-sharp] w-5 h-5 self-center" onClick={selectLePath}></span>
                    </label>
                </div>
            </div>
            <div>

            </div>
        </div>
    );
}


function About() {
    const { version, setVersion, releases, setReleases } = useAboutStore();
    const [versionComparisons, setVersionComparisons] = useState({});

    async function compareVersions(version1, version2) {
        try {
            return await window.electron.ipcRenderer.invoke('compare-versions', version1, version2);
        } catch (error) {
            console.error('版本比较错误:', error);
            return 0; // 出错时返回0，表示版本相同
        }
    }

    useEffect(() => {
        const compareAllVersions = async () => {
            const comparisons = {};
            for (const release of releases) {
                const result = await compareVersions(release.version, version);
                comparisons[release.version] = result;
            }
            setVersionComparisons(comparisons);
        };

        compareAllVersions();
    }, [releases, version]);


    return (
        <div className='flex flex-col w-full h-full pb-32 overflow-auto gap-7 p-7 scrollbar-base bg-custom-modal'>
            <div className='text-2xl font-bold text-custom-text-light'>
                关于
            </div>
            <div className='flex flex-col gap-2'>
                <div className='flex flex-row items-center gap-12'>
                    <span className='text-sm font-semibold'>版本</span>
                    <span className='text-sm'>{version}</span>
                </div>
                <div className='m-0 divider'></div>
                <div className='flex flex-row items-center gap-12'>
                    <span className='text-sm font-semibold'>作者</span>
                    <span className='text-sm'><a className='link-hover' href='https://github.com/ximu3' target='_blank'>ximu3</a></span>
                </div>
            </div>
            <div className='flex flex-col gap-2'>
                <div className='pb-2 font-bold text-custom-text-light'>支援</div>
                <div className='flex flex-col gap-2'>
                    <div className='flex flex-row items-center gap-12'>
                        <span className='text-sm font-semibold'>主页</span>
                        <a className='text-sm link-hover' href='https://github.com/ximu3/vnite' target='_blank'>https://github.com/ximu3/vnite</a>
                    </div>
                    <div className='m-0 divider'></div>
                    <div className='flex flex-row items-center gap-12'>
                        <span className='text-sm font-semibold'>反馈</span>
                        <a className='text-sm link-hover' href='https://github.com/ximu3/vnite/issues/new' target='_blank'>https://github.com/ximu3/vnite/issues/new</a>
                    </div>
                </div>
            </div>
            <div className='flex flex-col gap-2'>
                <div className='pb-2 font-bold text-custom-text-light'>版本</div>
                <div className='flex flex-col gap-2'>
                    {
                        releases.map((release, index) => {
                            return (
                                <div key={index} className='flex flex-col p-3 bg-custom-stress'>
                                    <div className='flex flex-row items-center justify-between'>
                                        <span className='flex flex-row items-center gap-2 text-sm font-semibold'>
                                            {release.version}
                                            {`v${version}` === release.version && <div className="text-xs font-normal border-custom-blue-6 badge badge-outline text-custom-blue-6 badge-sm">当前版本</div>}
                                            {index === 0 && <div className="text-xs font-normal border-custom-green badge badge-outline text-custom-green badge-sm">最新版本</div>}
                                        </span>
                                        <span className='text-xs'>{release.publishedAt.split('T')[0]}</span>
                                    </div>
                                    <div className='m-0 divider'></div>
                                    <div
                                        className='text-sm markdown-content'
                                        dangerouslySetInnerHTML={{ __html: release.description }}
                                    />
                                    {(() => {
                                        switch (versionComparisons[release.version]) {
                                            case 1:
                                                return (
                                                    <div className='flex flex-row-reverse pt-2'>
                                                        <a href={release.assets[0].downloadUrl} target='_blank' rel="noopener noreferrer" className='p-1 text-xs link-hover text-custom-text-light/90'>
                                                            更新
                                                        </a>
                                                    </div>
                                                );
                                            case 0:
                                                return (
                                                    <div className='flex flex-row-reverse pt-2'>
                                                        <span className='p-1 text-xs text-custom-text-light/60'>
                                                            当前版本
                                                        </span>
                                                    </div>
                                                );
                                            case -1:
                                                return (
                                                    <div className='flex flex-row-reverse pt-2'>
                                                        <a href={release.assets[0].downloadUrl} target='_blank' rel="noopener noreferrer" className='p-1 text-xs link-hover text-custom-text-light/90'>
                                                            回滚
                                                        </a>
                                                    </div>
                                                );
                                            default:
                                                return null;
                                        }
                                    })()}
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    );
}


function CloudSync() {
    const { configSetting, updateConfigSetting, setConfigAlert, isLoading, setIsLoading } = useConfigStore();
    const { updateConfig, config, setData, setCategoryData, setConfig } = useRootStore();
    useEffect(() => {
        window.electron.ipcRenderer.on('initialize-error', (event, message) => {
            setConfigAlert('Github仓库初始化失败：' + message);
            setTimeout(() => {
                setConfigAlert('');
            }, 5000);
        })
        window.electron.ipcRenderer.on('initialize-diff-data', (event) => {
            document.getElementById('initializeDiffData').showModal();
        })
        return () => {
            window.electron.ipcRenderer.removeAllListeners('initialize-error');
        }
    }, []);
    async function loginGithub() {
        const isGitInstalled = await window.electron.ipcRenderer.invoke('check-git-installed');
        if (!isGitInstalled) {
            setConfigAlert('请先安装Git！');
            setTimeout(() => {
                setConfigAlert('');
            }, 5000);
            window.electron.ipcRenderer.send('open-external', 'https://git-scm.com/downloads');
            return;
        }
        setIsLoading(true);
        const authData = await window.electron.ipcRenderer.invoke('start-auth-process', config.cloudSync.github.clientId, config.cloudSync.github.clientSecret)
        if (authData.username) {
            updateConfig(['cloudSync', 'github', 'username'], authData.username);
            updateConfig(['cloudSync', 'github', 'accessToken'], authData.accessToken);
            setConfigAlert('Github登录成功：' + authData.username);
            setTimeout(() => {
                setConfigAlert('');
            }, 5000);
            await window.electron.ipcRenderer.invoke('update-config-data', config);
            setIsLoading(true);
            const initData = await window.electron.ipcRenderer.invoke('initialize-repo', authData.accessToken, authData.username)
            if (initData) {
                setConfigAlert('数据即将完成初始化，请稍候...');
                setTimeout(() => {
                    setConfigAlert('');
                }, 5000);
                await window.electron.ipcRenderer.invoke('get-game-data').then((gameData) => {
                    setData(gameData);
                })
                await window.electron.ipcRenderer.invoke('get-category-data').then((categoryData) => {
                    setCategoryData(categoryData);
                })
                await window.electron.ipcRenderer.invoke('get-config-data').then((configData) => {
                    setConfig(configData);
                })
                updateConfig(['cloudSync', 'github', 'repoUrl'], initData);
                updateConfig(['cloudSync', 'github', 'lastSyncTime'], getFormattedDateTimeWithSeconds());
            }
            setIsLoading(false);
        } else {
            setConfigAlert('Github登录失败：' + authData);
            setTimeout(() => {
                setConfigAlert('');
            }, 5000);
            setIsLoading(false);
        }
    }
    function getFormattedDateTimeWithSeconds() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    async function githubSync() {
        const time = getFormattedDateTimeWithSeconds();
        setIsLoading(true);
        await window.electron.ipcRenderer.invoke('cloud-sync-github', time).then((data) => {
            if (data === 'success') {
                setConfigAlert('Github同步成功！');
                updateConfig(['cloudSync', 'github', 'lastSyncTime'], time);
                setTimeout(() => {
                    setConfigAlert('');
                }, 3000);
            } else {
                setConfigAlert('Github同步失败：' + data);
                setTimeout(() => {
                    setConfigAlert('');
                }, 3000);
            }
        })
        setIsLoading(false);
    }
    function webdavUpload() {
        const time = getFormattedDateTimeWithSeconds();
        window.electron.ipcRenderer.invoke('cloud-sync-webdav-upload', config['cloudSync']['webdav']['url'], config['cloudSync']['webdav']['username'], config['cloudSync']['webdav']['password'], config['cloudSync']['webdav']['path']).then((data) => {
            if (data === 'success') {
                setConfigAlert('WebDav上传成功！');
                updateConfig(['cloudSync', 'webdav', 'lastSyncTime'], time);
                setTimeout(() => {
                    setConfigAlert('');
                }, 3000);
            } else {
                setConfigAlert('WebDav上传失败：' + data);
                setTimeout(() => {
                    setConfigAlert('');
                }, 3000);
            }
        })
    }

    function webdavDownload() {
        const time = getFormattedDateTimeWithSeconds();
        window.electron.ipcRenderer.invoke('cloud-sync-webdav-download', config['cloudSync']['webdav']['url'], config['cloudSync']['webdav']['username'], config['cloudSync']['webdav']['password'], config['cloudSync']['webdav']['path']).then((data) => {
            if (data === 'success') {
                setConfigAlert('WebDav下载成功！');
                updateConfig(['cloudSync', 'webdav', 'lastSyncTime'], time);
                setTimeout(() => {
                    setConfigAlert('');
                }, 3000);
            } else {
                setConfigAlert('WebDav下载失败：' + data);
                setTimeout(() => {
                    setConfigAlert('');
                }, 3000);
            }
        })
    }
    function modeConvert(mode) {
        switch (mode) {
            case 'github':
                return 'Github';
            case 'webdav':
                return 'WebDav';
            default:
                return 'Github';
        }
    }
    async function useLocalData() {
        try {
            setIsLoading(true);
            await window.electron.ipcRenderer.invoke('initialize-use-local-data', config.cloudSync.github.accessToken, config.cloudSync.github.username);
            setIsLoading(false);
            document.getElementById('initializeDiffData').close();
            updateConfig(['cloudSync', 'github', 'repoUrl'], `https://github.com/${config.cloudSync.github.username}/my-vnite.git`);
            updateConfig(['cloudSync', 'github', 'lastSyncTime'], getFormattedDateTimeWithSeconds());
            await window.electron.ipcRenderer.invoke('get-game-data').then((data) => {
                setData(data);
            })
            await window.electron.ipcRenderer.invoke('get-category-data').then((categoryData) => {
                setCategoryData(categoryData);
            })
            await window.electron.ipcRenderer.invoke('get-config-data').then((configData) => {
                setConfig(configData);
            })
            setConfigAlert('本地数据已成功同步至云端！');
            setTimeout(() => {
                setConfigAlert('');
            }, 5000);
        } catch (e) {
            setIsLoading(false);
            console.log(e);
            setConfigAlert('使用本地数据失败：' + e);
            setTimeout(() => {
                setConfigAlert('');
            }, 3000);
        }
    }
    async function useCloudData() {
        try {
            setIsLoading(true);
            await window.electron.ipcRenderer.invoke('initialize-use-cloud-data', config.cloudSync.github.accessToken, config.cloudSync.github.username);
            setIsLoading(false);
            document.getElementById('initializeDiffData').close();
            updateConfig(['cloudSync', 'github', 'repoUrl'], `https://github.com/${config.cloudSync.github.username}/my-vnite.git`);
            updateConfig(['cloudSync', 'github', 'lastSyncTime'], getFormattedDateTimeWithSeconds());
            await window.electron.ipcRenderer.invoke('get-game-data').then((data) => {
                setData(data);
            })
            await window.electron.ipcRenderer.invoke('get-category-data').then((categoryData) => {
                setCategoryData(categoryData);
            })
            await window.electron.ipcRenderer.invoke('get-config-data').then((configData) => {
                setConfig(configData);
            })
            setConfigAlert('云端数据已成功同步到本地！');
            setTimeout(() => {
                setConfigAlert('');
            }, 5000);
        } catch (e) {
            setIsLoading(false);
            console.log(e);
            setConfigAlert('使用云端数据失败：' + e);
            setTimeout(() => {
                setConfigAlert('');
            }, 3000);
        }
    }
    async function signoutGithub() {
        setIsLoading(true);
        await window.electron.ipcRenderer.invoke('sign-out-github', config.cloudSync.github.accessToken, config.cloudSync.github.username).then((data) => {
            if (data === 'success') {
                updateConfig(['cloudSync', 'github', 'username'], '');
                updateConfig(['cloudSync', 'github', 'accessToken'], '');
                updateConfig(['cloudSync', 'github', 'repoUrl'], '');
                setConfigAlert('Github账号已退出！');
            } else {
                setConfigAlert('退出Github账号失败：' + data);
            }
            setTimeout(() => {
                setConfigAlert('');
            }, 3000);
        })
        setIsLoading(false);
    }
    async function switchGithub() {
        setIsLoading(true);
        await window.electron.ipcRenderer.invoke('sign-out-github', config.cloudSync.github.accessToken, config.cloudSync.github.username).then((data) => {
            if (data === 'success') {
                updateConfig(['cloudSync', 'github', 'username'], '');
                updateConfig(['cloudSync', 'github', 'accessToken'], '');
                updateConfig(['cloudSync', 'github', 'repoUrl'], '');
                setConfigAlert('Github账号已退出！');
            } else {
                setConfigAlert('退出Github账号失败：' + data);
            }
            setTimeout(() => {
                setConfigAlert('');
            }, 3000);
        })
        await loginGithub();

        setIsLoading(false);
    }
    async function openCloudSync(e) {
        const isChecked = e.target.checked;
        if (isChecked) {
            if (config.cloudSync.github.username) {
                setConfigAlert('正在同步数据，请稍候...');
                setTimeout(() => {
                    setConfigAlert('');
                }, 5000);
                await githubSync();
                updateConfig(['cloudSync', 'enabled'], isChecked);
            } else {
                setConfigAlert('请先登录Github账号！');
                setTimeout(() => {
                    setConfigAlert('');
                }, 3000);
                return
            }
        } else {
            updateConfig(['cloudSync', 'enabled'], isChecked);
        }
    }
    return (
        <div className='flex flex-col w-full h-full gap-5 pb-32 overflow-auto p-7 scrollbar-base bg-custom-modal'>
            <dialog id="initializeDiffData" className="modal">
                <div className="w-1/3 h-auto modal-box bg-custom-modal">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="absolute btn btn-sm btn-ghost right-2 top-2">✕</button>
                    </form>
                    <div className='w-full h-full p-3'>
                        <div className='font-bold'>本地数据与远程仓库不一致！</div>
                        <div className='pt-2'>该选择将覆盖某一端数据，请做好数据备份！</div>
                        <div className='flex flex-row-reverse gap-5 pt-7'>
                            <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={useLocalData}>
                                {isLoading && <span className='loading loading-spinner'></span>}
                                使用本地数据
                            </button>
                            <button className='transition-all btn bg-custom-stress text-custom-text-light hover:brightness-125' onClick={useCloudData} >
                                {isLoading && <span className='loading loading-spinner'></span>}
                                使用云端数据
                            </button>
                        </div>
                    </div>
                </div>
            </dialog>
            <div className='flex gap-2 text-2xl font-bold text-custom-text-light'>
                云同步
                <div className="self-center badge text-custom-text badge-outline badge-sm">beta</div>
            </div>
            <div className='flex flex-col gap-2'>
                <label className="p-0 cursor-pointer label">
                    <span className="text-sm font-semibold">是否开启</span>
                    <input type="checkbox" className="toggle checked:bg-custom-text-light bg-custom-text checked:[--tglbg:theme(colors.custom.blue-6)] [--tglbg:theme(colors.custom.stress)] border-0 hover:brightness-125 checked:hover:brightness-100" checked={config?.cloudSync?.enabled || false} onChange={(e) => { openCloudSync(e) }} />
                </label>
                <div className='m-0 divider'></div>
                <label className="flex p-0 label">
                    <span className="flex-grow text-sm font-semibold">同步模式</span>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="flex flex-row items-center justify-between w-full gap-2 pr-1 mb-1 text-sm font-semibold border-0 hover:text-custom-text-light input-sm bg-custom-stress hover:brightness-125">
                            <div className="flex items-center gap-3">
                                <div>{modeConvert(configSetting?.cloudSync?.mode || 'github')}</div>
                            </div>
                            <span className="icon-[material-symbols-light--keyboard-arrow-down] w-6 h-6"></span>
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu bg-custom-dropdown rounded-box z-[1] w-auto p-2 shadow">
                            <li onClick={() => { updateConfigSetting(['cloudSync', 'mode'], 'github') }} className='hover:bg-custom-text hover:text-black'><a className='transition-none hover:text-black'>Github</a></li>
                            <li onClick={() => { updateConfigSetting(['cloudSync', 'mode'], 'webdav') }} className='hover:bg-custom-text hover:text-black'><a className='transition-none hover:text-black'>WebDav</a></li>
                        </ul>
                    </div>
                </label>
            </div>
            <div className='flex flex-col gap-2'>
                <div className='flex flex-row gap-2 pb-2 font-bold text-custom-text-light'>Github<div className="self-center badge text-custom-text badge-outline badge-sm">推荐</div></div>
                {
                    config?.cloudSync?.github?.username ?
                        <div>
                            <div className='flex flex-row items-center'>
                                <span className="text-sm font-semibold grow">账号</span>
                                <div className="dropdown dropdown-end">
                                    <div tabIndex={0} role="button" className="flex flex-row items-center justify-between w-full gap-2 mb-1 text-sm font-semibold border-0 hover:text-custom-text-light input-sm bg-custom-stress hover:brightness-125">
                                        <div className="flex items-center gap-3">
                                            <div>{config['cloudSync']['github']['username']}</div>
                                        </div>
                                    </div>
                                    <ul tabIndex={0} className="dropdown-content menu bg-custom-dropdown rounded-box z-[1] p-2 shadow w-20">
                                        <li onClick={switchGithub} className='flex items-center justify-center p-0 text-xs hover:bg-custom-text hover:text-black'><a className='transition-none hover:text-black'>切换</a></li>
                                        <li onClick={signoutGithub} className='flex items-center justify-center p-0 text-xs hover:bg-custom-text hover:text-black'><a className='transition-none hover:text-black'>退出</a></li>
                                    </ul>
                                </div>
                            </div>
                            <div className='m-0 divider'></div>
                            <div className='flex flex-row items-center'>
                                <span className="text-sm font-semibold grow">仓库</span>
                                <a className="p-1 text-sm font-semibold link-hover hover:text-custom-text-light" href={`https://github.com/${config['cloudSync']['github']['username']}/my-vnite`} target='_blank'>{`${config['cloudSync']['github']['username']}/my-vnite`}</a>
                            </div>
                            <div className='m-0 divider'></div>
                            <div className='flex flex-row items-center gap-2'>
                                <span className="text-sm font-semibold grow">最后同步时间</span>
                                <span className="p-1 text-sm font-semibold">{config['cloudSync']['github']['lastSyncTime']}</span>
                                <button className='transition-all btn btn-xs bg-custom-stress hover:brightness-125 hover:text-custom-text-light' onClick={githubSync}>
                                    {isLoading && <span className='loading loading-spinner loading-xs'></span>}
                                    同步
                                </button>
                            </div>
                        </div>
                        :
                        <div className='flex flex-row'>
                            <span className="text-sm font-semibold grow">账号</span>
                            <button className='self-center transition-all btn-sm btn bg-custom-stress hover:brightness-125' onClick={loginGithub}>登录</button>
                        </div>
                }
            </div>
            <div className='flex flex-col gap-2'>
                <div className='pb-2 font-bold text-custom-text-light'>WebDav</div>
                <div className='flex flex-row items-center'>
                    <span className="text-sm font-semibold grow">地址</span>
                    <input spellCheck='false' className="w-1/2 min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light/95 bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100" placeholder='示例：https://pan.example.xyz' value={configSetting?.cloudSync?.webdav?.url || ''} onChange={(e) => { updateConfigSetting(['cloudSync', 'webdav', 'url'], e.target.value) }} />
                </div>
                <div className='m-0 divider'></div>
                <div className='flex flex-row items-center'>
                    <span className="text-sm font-semibold grow">路径</span>
                    <input spellCheck='false' className="w-1/2 min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light/95 bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100" placeholder='示例：/dav/my-vnite' value={configSetting?.cloudSync?.webdav?.path || ''} onChange={(e) => { updateConfigSetting(['cloudSync', 'webdav', 'path'], e.target.value) }} />
                </div>
                <div className='m-0 divider'></div>
                <div className='flex flex-row items-center'>
                    <span className="text-sm font-semibold grow">用户名</span>
                    <input spellCheck='false' className="w-1/3 min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light/95 bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100" value={configSetting?.cloudSync?.webdav?.username || ''} onChange={(e) => { updateConfigSetting(['cloudSync', 'webdav', 'username'], e.target.value) }} />
                </div>
                <div className='m-0 divider'></div>
                <div className='flex flex-row items-center'>
                    <span className="text-sm font-semibold grow">密码</span>
                    <input spellCheck='false' className="w-1/3 min-h-0 border-0 outline-none input focus:bg-custom-focus focus:text-custom-text-light/95 bg-custom-stress input-sm hover:brightness-125 focus:shadow-inner-sm focus:shadow-black/80 focus:hover:brightness-100" value={configSetting?.cloudSync?.webdav?.password || ''} onChange={(e) => { updateConfigSetting(['cloudSync', 'webdav', 'password'], e.target.value) }} />
                </div>
                <div className='m-0 divider'></div>
                <div className='flex flex-row items-center gap-2'>
                    <span className="text-sm font-semibold grow">最后同步时间</span>
                    <span className="p-1 text-sm font-semibold">{config?.cloudSync?.webdav?.lastSyncTime}</span>
                    <button className='transition-all btn btn-xs bg-custom-stress hover:brightness-125 hover:text-custom-text-light' onClick={webdavUpload}>上传</button>
                    <button className='transition-all btn btn-xs bg-custom-stress hover:brightness-125 hover:text-custom-text-light' onClick={webdavDownload}>下载</button>
                </div>
            </div>
        </div>
    );
}

export default Config;