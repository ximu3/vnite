import bg from '../assets/bg.webp'
import cover from '../assets/cover.webp'
import c1 from '../assets/c1.jpg'
import c2 from '../assets/c2.jpg'
import mem from '../assets/mem.webp'
import { Icon } from '@iconify/react/dist/iconify.js'
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useRootStore } from './Root'

function NavTab({to, name}){
    return (
    <NavLink className={({ isActive, isPending }) =>
      isPending
        ? "tab"
        : isActive
        ? "tab tab-active"
        : "tab"
    }
    to={to} role="tab">
      {name}
    </NavLink>
  )
}

function Game({index}) {
    const { data, setData } = useRootStore();
    const gameData = data[index]['detail'];
    const characterData = data[index]['characters'];
    return (
        <div className="flex flex-col w-full h-full overflow-auto scrollbar-base scrollbar-w-2">
            <div className="relative w-full h-96">
                
                <img src={gameData['backgroundImage']} alt="bg" className="object-cover w-full h-full"></img>
                
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-base-100"></div>
                
                {/* <img alt="cover image" src={gameData['cover']} className="absolute z-10 object-cover w-56 h-auto transform border-2 right-16 lg:right-24 2xl:right-40 2xl:-bottom-60 -bottom-16 lg:-bottom-48 lg:w-64 2xl:w-80 border-primary"></img> */}
                
                {/* <div class="absolute right-16 lg:right-28 -bottom-16 lg:-bottom-40 transform w-56 h-72 lg:w-64 lg:h-96 bg-base-100 bg-opacity-15 z-20"></div> */}
           
                <div className="absolute flex flex-row gap-2 text-4xl font-bold left-14 -bottom-14">
                    {gameData['chineseName'] ? gameData['chineseName'] : gameData['name']}
                    <div className="self-center font-normal badge badge-outline badge-success">云存档：最新</div>
                    <div className="self-center font-normal badge badge-outline badge-accent">游玩中</div>
                </div>
                <button className='absolute w-28 btn left-14 -bottom-32 btn-success'>开始</button>
                <button className='absolute w-28 btn left-48 -bottom-32 btn-accent'>设置</button>

                {/* <div className="absolute z-0 w-full divider -bottom-44"></div> */}
                <div className="absolute z-0 flex flex-row items-center w-full pl-8 h-28 -bottom-67 ">
                    <div className="stats bg-base-300">
                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <span className="icon-[material-symbols-light--menu-open] w-14 h-14"></span>
                            </div>
                            <div className="stat-title">最后运行日期</div>
                            <div className="stat-value text-secondary">{gameData['lastVisitDate'] ? gameData['lastVisitDate'] : "还未运行过"}</div>
                        </div>
                        <div className="stat">
                            <div className="flex items-center justify-center stat-figure text-secondary">
                                <span className="icon-[material-symbols-light--avg-time-outline-sharp] w-14 h-14"></span>
                            </div>
                            <div className="stat-title">游戏时长</div>
                            <div className="stat-value text-secondary">17.3小时</div>
                            {/* <div className="stat-desc">21% more than last month</div> */}
                        </div>
                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <span className="icon-[material-symbols-light--calendar-add-on-outline-sharp] w-14 h-14"></span>
                            </div>
                            <div className="stat-title">添加日期</div>
                            <div className="stat-value text-secondary">{gameData['addDate']}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col w-full pt-77">
                <div role="tablist" className="pl-44 pr-44 tabs tabs-bordered">
                    <NavTab to="./detail" name="详情" />
                    <NavTab to="./character" name="角色" />
                    {/* <NavTab to="./2.5" name="版本" /> */}
                    <NavTab to="./save" name="存档" />
                    <NavTab to="./memory" name="回忆" />
                </div>
                <div className='flex pl-8 pr-8 pt-7 pb-7 grow-0'>
                    <Routes>
                        <Route index element={<Navigate to='./detail' />} />
                        <Route path='/detail' element={<Detail gameData={gameData} />} />
                        <Route path='/character' element={<Character characterData={characterData} />} />
                        <Route path='/save' element={<Save />} />
                        <Route path='/memory' element={<Memory />} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}

function Detail({gameData}){
    return (
        <div className='flex flex-row items-start w-full gap-5 grow-0'>
            <div className='flex flex-col w-2/3 gap-5 grow-0'>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>游戏简介</div>
                    <div className='pt-2 text-sm whitespace-pre-wrap'>
                        {gameData['introduction']}
                    </div>
                </div>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>发行列表</div>
                    <div className="flex flex-col gap-2 pt-2 text-sm">
                        {gameData['releases'].map((release, index) => {
                            return (
                                <div key={index} className='flex flex-row justify-between'>
                                    <div>
                                        <a className='link link-hover' href={release['relatedLink']} target='_blank'>{release['releaseName']}</a>
                                        <div className='text-xs'>发行时间：{release['releaseDate']}&nbsp;&nbsp;发行语言：{release['releaseLanguage']}</div>
                                    </div>
                                    <div className='flex gap-2'>
                                        <div className='badge-outline badge badge-info'>{release['platform']}</div>
                                        <div className={release['restrictionLevel'] === 'R18+' ? "badge-outline badge badge-error" : "badge-outline badge badge-success"}>{release['restrictionLevel']}</div>
                                    </div>
                                </div>
                            )
                        })}
                        {/* <div className='flex flex-row justify-between'>
                            <div>
                                <a className='link link-hover' href='http://kinkoi.nekonyansoft.com/' target='_blank'>金辉恋曲四重奏</a>
                                <div className='text-xs'>发行时间：2021-06-11&nbsp;&nbsp;发行语言：Japanese</div>
                            </div>
                            <div className='flex gap-2'>
                                <div className='badge-outline badge badge-info'>Windows</div>
                                <div className='badge-outline badge badge-success'>全年龄</div>
                            </div>
                        </div>
                        <div className='flex flex-row justify-between'>
                            <div>
                                <a className='link link-hover' href='http://kinkoi.nekonyansoft.com/' target='_blank'>Kinkoi: Golden Loveriche 18+ Steam Patch</a>
                                <div className='text-xs'>发行时间：2021-06-11&nbsp;&nbsp;发行语言：Japanese</div>
                            </div>
                            <div className='flex gap-2'>
                                <div className='badge-outline badge badge-info'>Windows</div>
                                <div className='badge-outline badge badge-error'>R18+</div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
            <div className='flex flex-col w-1/3 gap-5'>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>作品信息</div>
                    <div className='pt-2 text-sm'>
                        <div>原名：{gameData['name']}</div>
                        <div>中文名：{gameData['chineseName']}</div>
                        <div>发行日期：{gameData['releaseDate']}</div>
                        <div>会社：<a className='link link-hover' href={`https://www.ymgal.games/oa${gameData['developerId']}`}>{gameData['developer']}</a></div>
                        <div>类型：{gameData['typeDesc']}</div>
                    </div>
                </div>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>相关网站</div>
                    <div className="pt-2 text-sm">
                        {gameData['websites'].map((website, index) => {
                            return <div key={index}>▪<a className='link link-secondary' href={website['url']} target='_blank'>{website['title']}</a></div>
                        })}
                        {/* <div>▪官网：<a className='link link-secondary' href="http://sagaplanets.product.co.jp/works/kinkoigt/" target="_blank" rel="noreferrer">http://sagaplanets.product.co.jp/works/kinkoigt/</a></div>
                        <div>▪Steam：<a className='link link-secondary' href="https://store.steampowered.com/app/1277940/_/" target="_blank" rel="noreferrer">https://store.steampowered.com/app/1277940/_/</a></div>
                        <div>▪月幕Galgame：<a className='link link-secondary' href="https://www.ymgal.games/ga27702" target="_blank" rel="noreferrer">https://www.ymgal.games/ga27702</a></div> */}
                    </div>
                </div>
                <div className='p-3 bg-base-300'>
                    <div className='font-bold'>STAFF</div>
                    <div className='pt-1 text-sm'>
                        {
                            Object.keys(gameData['staff']).map((key, index) => {
                                return (
                                    <div key={index}>
                                        <div>{key}：</div>
                                        {
                                            gameData['staff'][key].map((staff, index) => {
                                                return (
                                                    <div key={index}>&nbsp;▪<a className='link link-secondary' href={`https://www.ymgal.games/pa${staff['pid']}`} target='_blank'>{staff['name']}</a><span className='text-xs'>{staff['empDesc'] && `(${staff['empDesc']})`}</span></div>
                                                )
                                            })
                                        }
                                    </div>
                                )
                            })
                        }
                        {/* <div>脚本：</div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">さかき 傘</a></div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">にっし～</a><span className='text-xs'>（Akane）</span></div>
                        <div>音乐：</div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">松本 慎一郎</a><span className='text-xs'>（BGM）</span></div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">尾崎武士</a><span className='text-xs'>（ED guitar）</span></div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">高瀬 一矢</a><span className='text-xs'>（ED）</span></div>
                        <div>原画：</div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">アトリエ空機関</a><span className='text-xs'>（Backgrounds）</span></div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">ぴこぴこぐらむ</a><span className='text-xs'>（Chieka, SD）</span></div> */}
                        {/* <div>歌曲：</div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">さかき 傘</a></div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">にっし～</a><span className='text-xs'>（Akane）</span></div>
                        <div>人物设计：</div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">さかき 傘</a></div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">にっし～</a><span className='text-xs'>（Akane）</span></div>
                        <div>监督：</div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">さかき 傘</a></div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">にっし～</a><span className='text-xs'>（Akane）</span></div>
                        <div>其他：</div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">さかき 傘</a></div>
                        <div>&nbsp;▪<a className='link link-secondary' href="https://www.ymgal.games/pa12298" target="_blank" rel="noreferrer">にっし～</a><span className='text-xs'>（Akane）</span></div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Character({characterData}){
    return (
        <div className='flex flex-col w-full gap-5'>
            { characterData.map((character, index) => {
                return (
                    <div>
                        <div key={index} className='flex flex-row items-start gap-5'>
                            <div className='flex flex-row w-3/4 bg-base-300 grow'>
                                {character['cover'] && <img src={character['cover']} alt="c1" className="bg-cover"></img>}
                                <div className='flex flex-col'>
                                    <div className='p-3 text-lg font-bold'>{character['chineseName'] ? character['chineseName'] : character['name']}</div>
                                    <div className='p-3 pt-0 text-sm'>{character['introduction']}</div>
                                </div>
                            </div>
                            <div className='flex flex-col w-1/4 gap-5 text-sm'>
                                <div className='p-3 bg-base-300'>
                                    <div className='pb-2 font-bold'>基本信息</div>
                                    <div>原名：{character['name']}</div>
                                    <div>中文名：{character['chineseName'] ? character['chineseName'] : "未知"}</div>
                                    <div>别名：{character['extensionName'][0] ? character['extensionName'].join('、') : "未知"}</div>
                                    <div>生日：{character['birthday'] ? character['birthday'] : "未知"}</div>
                                    <div>性别：{character['gender'] === 0 ? "未知" : character['gender'] === 1 ? "男" : character['gender'] === 2 ? "女" : "扶她"}</div>
                                </div>
                                <div className='p-3 bg-base-300'>
                                    <div className='pb-2 font-bold'>相关网站</div>
                                    {character['websites'].map((website, index) => {
                                        return <div key={index}>▪<a className='link link-secondary' href={website['url']} target="_blank" rel="noreferrer">{website['title']}</a></div>
                                    })}
                                </div>
                            </div>
                        </div>
                        {index + 1 !== characterData.length && <div className='pt-6 divider'></div>}
                    </div>
                )
            })}
            {/* <div className='flex flex-row items-start justify-between gap-5'>
                <div className='flex flex-row w-3/4 bg-base-300 grow'>
                    <img src={c1} alt="c1" className="bg-cover"></img>
                    <div className='flex flex-col'>
                        <div className='p-3 text-lg font-bold'>玛里亚·毕肖普</div>
                        <div className='p-3 pt-0 text-sm'>主人公无比痴迷的歌手。<br />自从于网络发布歌曲,迄今在全世界已有过亿下载量,<br />包揽了美国、英国、日本的无数音乐大奖。<br />被称为日本音乐界最后的女歌手。<br />没有与艺人事务所签约,<br />除了歌曲无法查询她的任何个人信息。</div>
                    </div>
                </div>
                <div className='flex flex-col w-1/4 gap-5 text-sm'>
                    <div className='p-3 bg-base-300'>
                        <div className='pb-2 font-bold'>基本信息</div>
                        <div>原名：マリア・ビショップ</div>
                        <div>中文名：玛里亚·毕肖普</div>
                        <div>别名：Maria Bishop</div>
                        <div>生日：03-03</div>
                        <div>性别：女</div>
                    </div>
                    <div className='p-3 bg-base-300'>
                        <div className='pb-2 font-bold'>相关网站</div>
                        <div>▪<a className='link link-secondary' href="http://sagaplanets.product.co.jp/works/kinkoigt/" target="_blank" rel="noreferrer">月幕Galgame</a></div>
                        <div>▪<a className='link link-secondary' href="http://sagaplanets.product.co.jp/works/kinkoigt/" target="_blank" rel="noreferrer">VNDB</a></div>
                    </div>
                </div>
            </div>
            <div className='m-0 divider'></div>
            <div className='flex flex-row items-start justify-between gap-5'>
                <div className='flex flex-row w-3/4 bg-base-300 grow'>
                    <img src={c2} alt="c1" className="bg-cover"></img>
                    <div className='flex flex-col'>
                        <div className='p-3 text-lg font-bold'>僧间理亚</div>
                        <div className='p-3 pt-0 text-sm'>生性阴郁的混混少女,与央路不同班。<br />爱抽烟,因此数次受到停学处分。<br />嘴非常毒,对任何事都表现得毫无兴趣,性格乖僻。<br />是全校闻名的不良学生,除了玲奈等生性开朗的人以外没有人接近她</div>
                    </div>
                </div>
                <div className='flex flex-col w-1/4 gap-5 text-sm'>
                    <div className='p-3 bg-base-300'>
                        <div className='pb-2 font-bold'>基本信息</div>
                        <div>原名：僧間 理亜</div>
                        <div>中文名：僧间理亚</div>
                        <div>别名： ソーマ君 、 Souma-kun 、 Soma Ria 、 そうま りあ 、 Souma Ria 、 ソーマ君</div>
                        <div>生日：03-03</div>
                        <div>性别：女</div>
                    </div>
                    <div className='p-3 bg-base-300'>
                        <div className='pb-2 font-bold'>相关网站</div>
                        <div>▪<a className='link link-secondary' href="http://sagaplanets.product.co.jp/works/kinkoigt/" target="_blank" rel="noreferrer">月幕Galgame</a></div>
                        <div>▪<a className='link link-secondary' href="http://sagaplanets.product.co.jp/works/kinkoigt/" target="_blank" rel="noreferrer">VNDB</a></div>
                    </div>
                </div>
            </div> */}
        </div> 
    )
}

function Save(){
    return (
        <div className='w-full'>
            <div className="overflow-x-auto bg-base-300">
                <table className="table">
                    {/* head */}
                    <thead>
                    <tr>
                        <th></th>
                        <th>存档时间</th>
                        <th className='w-1/2'>备注</th>
                        <th>操作</th>
                    </tr>
                    </thead>
                    <tbody>
                    {/* row 1 */}
                    <tr>
                        <th>1</th>
                        <td>2024-7-14 12:59:32</td>
                        <td>第一次存档</td>
                        <td>
                            <div className='flex flex-row gap-2'>
                                <button className="h-6 min-h-0 btn btn-success">切换</button>
                                <button className="h-6 min-h-0 btn btn-accent">编辑</button>
                                <button className="h-6 min-h-0 btn btn-error">删除</button>
                            </div>
                        </td>
                    </tr>
                    {/* row 2 */}
                    <tr>
                        <th>2</th>
                        <td>2024-7-14 13:09:11</td>
                        <td></td>
                        <td>
                            <div className='flex flex-row gap-2'>
                                <button className="h-6 min-h-0 btn btn-success">切换</button>
                                <button className="h-6 min-h-0 btn btn-accent">编辑</button>
                                <button className="h-6 min-h-0 btn btn-error">删除</button>
                            </div>
                        </td>
                    </tr>
                    {/* row 3 */}
                    <tr>
                        <th>3</th>
                        <td>2024-7-14 13:10:03</td>
                        <td></td>
                        <td>
                            <div className='flex flex-row gap-2'>
                                <button className="h-6 min-h-0 btn btn-success">切换</button>
                                <button className="h-6 min-h-0 btn btn-accent">编辑</button>
                                <button className="h-6 min-h-0 btn btn-error">删除</button>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function Memory(){
    return(
        <div className='flex flex-col w-full gap-7'>
            <div className='flex flex-col w-full'>
                <img src={bg} className='w-full h-auto'></img>
                <div className='p-3 bg-base-300'>夕阳与少女与烟</div>
            </div>
            <div className='flex flex-col w-full'>
                <img src={mem} className='w-full h-auto'></img>
                <div className='p-3 bg-base-300'>夕阳与少女与死亡</div>
            </div>
        </div>
    )
}

export default Game