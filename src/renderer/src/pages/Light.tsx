import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { useConfigState } from '~/hooks'
import { useAttachmentStore } from '~/stores'
import { useBackgroundRefreshStore } from '~/stores/config'
import { sortGames, useGameCollectionStore } from '~/stores/game'
import { cn } from '~/utils'

export function Light(): JSX.Element {
  const { pathname } = useLocation()
  const [gameId, setGameId] = useState<string>('')
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const { getAttachmentInfo, setAttachmentError } = useAttachmentStore()
  const getGameCollectionValue = useGameCollectionStore((state) => state.getGameCollectionValue)
  const collections = useGameCollectionStore((state) => state.documents)
  const [customBackgroundMode] = useConfigState('appearances.background.customBackgroundMode')
  const [glassBlur] = useConfigState('appearances.glass.blur')
  const [glassOpacity] = useConfigState('appearances.glass.opacity')
  const [backgroundImageNames, setBackgroundImageNames] = useState<string[]>([]);
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [timerImageBackground] = useConfigState('appearances.background.timerBackground')
  const tokenBackgroundImageRefresh = useBackgroundRefreshStore(state => state.refreshToken)

  // Get game background URL
  function getGameBackgroundUrl(id: string): string {
  const info = getAttachmentInfo('game', id, 'images/background.webp');
  return `attachment://game/${id}/images/background.webp?t=${info?.timestamp}`;
}

  // Get custom background URL
  function getCustomBackgroundUrl(): string | undefined {
    const name = backgroundImageNames[currentBackgroundIndex];
    if (!name) return undefined;
    const info = getAttachmentInfo('config', 'media', name);
    return `attachment://config/media/${name}?t=${info?.timestamp ?? ''}`;
  }

  // Check if custom background is available
  function isCustomBackgroundAvailable(): boolean {
    return !getAttachmentInfo('config', 'media', backgroundImageNames[currentBackgroundIndex])?.error
  }

  // Get recent game ID
  const getRecentGameId = (): string => sortGames('record.lastRunDate', 'desc')[0]

  // Preload image
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = (): void => resolve()
      img.onerror = (error): void => reject(error)
      img.src = url
    })
  }

  // Set new background image URL and preload
  function updateBackgroundImage(newUrl: string, newGameId: string = ''): void {
    if (newUrl === currentImageUrl) return;

    // Remove isLoading related code
    preloadImage(newUrl)
      .then(() => {
        setCurrentImageUrl(newUrl);
        if (newGameId) setGameId(newGameId);
      })
      .catch(() => {
        // Handle image loading failure
        if (newGameId) {
          setAttachmentError('game', newGameId, 'images/background.webp', true);
        } else if (customBackgroundMode !== 'default') {
          setAttachmentError('config', 'media', backgroundImageNames[currentBackgroundIndex], true);
        }
      });
  }

  //Update specific constants depending on the current page
  useEffect(() => {
    //Change current game
    if (pathname.includes('/library/games/')) {
      const currentGameId = pathname.split('/games/')[1]?.split('/')[0]
      updateBackgroundImage(getGameBackgroundUrl(currentGameId), currentGameId)
    }
    //Change current collection
    else if (pathname.includes('/library/collections')) {
      const currentCollectionId = pathname.split('/collections/')[1]?.split('/')[0]
      if (!currentCollectionId) {
        const url = getCustomBackgroundUrl();
        if (isCustomBackgroundAvailable() && customBackgroundMode !== 'default' && url) {
          updateBackgroundImage(url);
        }
        else {
          const recentGameId = getRecentGameId()
          updateBackgroundImage(getGameBackgroundUrl(recentGameId), recentGameId)
        }
        return
      }

      const currentGameId = getGameCollectionValue(currentCollectionId, 'games')[0]
      if (currentGameId) {
        updateBackgroundImage(getGameBackgroundUrl(currentGameId), currentGameId)
      }
    }
    //Another page
    else {
      if (customBackgroundMode === 'default')
      {
          //Loads the recent game as an image
          const recentGameId = getRecentGameId()
          if (recentGameId !== undefined) 
            updateBackgroundImage(getGameBackgroundUrl(recentGameId), recentGameId)

          //If there is no game in the database, it will simply remove the background image
          else setCurrentImageUrl('')
      }
      else if (customBackgroundMode !== 'default' && backgroundImageNames.length > 0) {
        const url = getCustomBackgroundUrl()
        if (url) updateBackgroundImage(url)
        return
      }
    }
  }, [pathname, getGameCollectionValue, collections, customBackgroundMode, backgroundImageNames, currentBackgroundIndex])

  //Reset the array of custom background images if the selected mode has changed
  useEffect(() => {
    if (customBackgroundMode !== 'default') {
      window.api.theme.getConfigBackground('buffer', true)
        .then((names: string[]) => {
          setBackgroundImageNames(Array.isArray(names) ? names : []);
          setCurrentBackgroundIndex(0);
        })
        .catch(() => {
          setBackgroundImageNames([]);
          setCurrentBackgroundIndex(0);
        });
    } else {
      setBackgroundImageNames([]);
      setCurrentBackgroundIndex(0);
    }
  }, [customBackgroundMode, tokenBackgroundImageRefresh]);

  //Change background periodically if enough time has passed
  useEffect(() => {
    if (customBackgroundMode !== 'slideshow' || backgroundImageNames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBackgroundIndex(i => (i + 1) % backgroundImageNames.length);
    }, timerImageBackground * 1000);

    return () => clearInterval(interval);
  }, [customBackgroundMode, backgroundImageNames.length, timerImageBackground]);

  // Update CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--glass-opacity', glassOpacity.toString())
    document.documentElement.style.setProperty('--glass-blur', `${glassBlur}px`)
  }, [glassOpacity, glassBlur])

  return (
    <div className="absolute top-0 left-0 object-cover w-full h-full pointer-events-none -z-10">
      <div
        className={cn(
          'absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/[var(--glass-opacity)] via-[63%] via-background/95 to-background/95 backdrop-blur-[var(--glass-blur)] z-10'
        )}
      ></div>

      <TransitionGroup className="w-full h-full">
        <CSSTransition key={currentImageUrl} timeout={250} classNames="background-fade">
          <img
            src={currentImageUrl}
            loading="lazy"
            decoding="async"
            alt=""
            className="absolute top-0 left-0 object-cover w-full h-full"
            onError={() => {
              if (customBackgroundMode !== 'default') {
                setAttachmentError('config', 'media', backgroundImageNames[currentBackgroundIndex], true)
              } else {
                setAttachmentError('game', gameId, 'images/background.webp', true)
              }
            }}
          />
        </CSSTransition>
      </TransitionGroup>
    </div>
  )
}
