import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { create } from 'zustand';
import { useRootStore } from './Root'
import { useEffect, useState } from 'react'


function NavButton({ to, name }) {
  return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? ""
        : isActive
        ? "bg-primary text-base-100"
        : ""
    }
    to={to}>
      {name}
    </NavLink>
  )

}

const useConfigStore = create(set => ({
    configSetting: {},
    configAlert: "",
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
}));

function Config() {
    const { config, setConfig } = useRootStore();
    const { configSetting, setConfigSetting, configAlert } = useConfigStore();
    const keyToName = {
        cloudSync: "云同步",
    };
    useEffect(() => {
        setConfigSetting(config);
    }, [config]);
    function saveConfig() {
        setConfig(configSetting);
    }
    function quit() {
        setConfigSetting(config);
    }
    return (
        <dialog id="my_modal_0" className="modal">
            <div className="w-1/2 max-w-full max-h-full p-0 h-5/6 modal-box">
                <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="absolute btn btn-sm btn-ghost right-2 top-2" onClick={quit}>✕</button>
                </form>


                <div className="flex flex-row w-full h-full">
                    <div className="flex flex-col h-full p-3 w-52 bg-base-300 shrink-0">
                        <div className="w-full grow">
                            <div className='pt-2 pb-2 pl-4 text-xl font-bold'>设置</div>
                            <ul className="w-full menu rounded-box">
                                {
                                    Object.keys(config).map(key => (
                                        <li key={key}>
                                            <NavButton to={`./${key}`} name={keyToName[key]} />
                                        </li>
                                    ))
                                }
                            </ul>
                            
                        </div>
                    </div>
                    <div className="grow">
                        <Routes>
                            <Route index element={<Navigate to='./cloudSync' />} />
                                {
                                    Object.keys(config).map(key => (
                                        <Route key={key} path={`/${key}/*`} element={<CloudSync />} />
                                    ))
                                }
                        </Routes>
                        <div className='absolute flex flex-row gap-3 right-5 bottom-5'>
                            <button className="btn btn-success" onClick={saveConfig}>保存</button>
                            <button className="btn btn-error" onClick={quit}>取消</button>
                        </div>
                    </div>
                    {
                        configAlert &&
                            <div className="toast toast-center">
                                <div className="alert alert-error">
                                    <span className='text-base-100'>{configAlert}</span>
                                </div>
                            </div>
                    }
                </div>


            </div>
        </dialog>
    );
}
