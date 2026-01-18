import { gameDoc } from '@appTypes/models'

export const PLAY_STATUS_ICONS: Record<gameDoc['record']['playStatus'], string> = {
  unplayed: 'icon-[mdi--bookmark-outline]',
  playing: 'icon-[mdi--map-marker-path]',
  // playing: 'icon-[mdi--progress-clock]',
  partial: 'icon-[mdi--progress-check]',
  finished: 'icon-[mdi--check-circle-outline]',
  multiple: 'icon-[mdi--check-decagram-outline]',
  shelved: 'icon-[mdi--archive-outline]'
}
