
import { Player, Match } from './types';

export const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'James Rizo' },
  { id: '2', name: 'Ana' },
  { id: '3', name: 'Beto' },
  { id: '4', name: 'Carla' },
  { id: '5', name: 'Daniel' },
  { id: '6', name: 'Eduardo' },
].sort((a, b) => a.name.localeCompare(b.name));

const p = (id: string) => MOCK_PLAYERS.find(player => player.id === id)!;

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate() - 8);
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);


export const MOCK_MATCHES: Match[] = [
  { id: 'm1', teamA: { players: [p('1'), p('2')], score: 15 }, teamB: { players: [p('3'), p('4')], score: 12 }, winner: 'A', timestamp: new Date(), duration: 25 },
  { id: 'm2', teamA: { players: [p('5'), p('3')], score: 10 }, teamB: { players: [p('1'), p('4')], score: 15 }, winner: 'B', timestamp: new Date(), duration: 30 },
  { id: 'm3', teamA: { players: [p('2'), p('5')], score: 15 }, teamB: { players: [p('3'), p('1')], score: 9 }, winner: 'A', timestamp: yesterday, duration: 22 },
  { id: 'm4', teamA: { players: [p('4'), p('2')], score: 15 }, teamB: { players: [p('5'), p('1')], score: 13 }, winner: 'A', timestamp: yesterday, duration: 28 },
  { id: 'm5', teamA: { players: [p('6'), p('1')], score: 15 }, teamB: { players: [p('3'), p('5')], score: 11 }, winner: 'A', timestamp: lastWeek, duration: 26 },
  { id: 'm6', teamA: { players: [p('2'), p('3')], score: 8 }, teamB: { players: [p('6'), p('4')], score: 15 }, winner: 'B', timestamp: lastMonth, duration: 35 },
];
