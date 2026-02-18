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

export const PLAY_STATUS_COLORS: Record<gameDoc['record']['playStatus'], string> = {
  unplayed: '',
  playing: 'text-blue-500',
  partial: 'text-green-500',
  finished: 'text-green-500',
  multiple: 'text-green-500',
  shelved: 'text-orange-500'
}
