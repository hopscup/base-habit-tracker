'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';

const CONTRACT_ADDRESS = '0x2d0c8CcF8524B7ffAdB78389CcdB75C875631F09';

const CONTRACT_ABI = [
  {
    inputs: [
      { name: 'habitId', type: 'uint256' },
      { name: 'date', type: 'uint256' }
    ],
    name: 'checkIn',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'habitId', type: 'uint256' },
      { name: 'date', type: 'uint256' }
    ],
    name: 'hasCheckedIn',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const HABIT_COLORS = [
  { bg: '#dbeafe', border: '#60a5fa', button: '#0052FF', name: 'Blue' },
  { bg: '#fce7f3', border: '#f9a8d4', button: '#ec4899', name: 'Pink' },
  { bg: '#dcfce7', border: '#86efac', button: '#22c55e', name: 'Green' },
  { bg: '#fef3c7', border: '#fcd34d', button: '#f59e0b', name: 'Yellow' },
  { bg: '#e0e7ff', border: '#a5b4fc', button: '#6366f1', name: 'Indigo' },
  { bg: '#fed7aa', border: '#fdba74', button: '#f97316', name: 'Orange' },
  { bg: '#e9d5ff', border: '#c084fc', button: '#a855f7', name: 'Purple' },
  { bg: '#ccfbf1', border: '#5eead4', button: '#14b8a6', name: 'Teal' },
];

interface Habit {
  id: number;
  name: string;
  colorIndex: number;
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([
    { id: 0, name: 'Daily Check-in App', colorIndex: 0 }
  ]);
  const [currentHabitIndex, setCurrentHabitIndex] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, isPending } = useWriteContract();
  
  const currentHabit = habits[currentHabitIndex];
  const currentColor = HABIT_COLORS[currentHabit.colorIndex];
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const getDateTimestamp = (day: number) => {
    return Math.floor(new Date(currentYear, currentMonth, day).getTime() / 1000 / 86400);
  };

  const handleCheckIn = async (day: number) => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const dateTimestamp = getDateTimestamp(day);
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'checkIn',
        args: [BigInt(currentHabit.id), BigInt(dateTimestamp)],
        value: parseEther('0.00001'),
        chainId: base.id
      });
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Transaction failed! Check console for details.');
    }
  };

  const addNewHabit = () => {
    if (!newHabitName.trim()) return;
    
    const newHabit: Habit = {
      id: habits.length,
      name: newHabitName.trim(),
      colorIndex: selectedColorIndex
    };
    
    setHabits([...habits, newHabit]);
    setCurrentHabitIndex(habits.length);
    setShowAddHabitModal(false);
    setNewHabitName('');
    setSelectedColorIndex(0);
  };

  const getDaysArray = () => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getWalletIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('base')) return '/wallets/base.png';
    if (nameLower.includes('coinbase')) return '/wallets/base.png';
    if (nameLower.includes('metamask')) return '/wallets/metamask.png';
    if (nameLower.includes('rabby')) return '/wallets/rabby.png';
    if (nameLower.includes('keplr')) return '/wallets/keplr.png';
    if (nameLower.includes('phantom')) return '/wallets/phantom.png';
    if (nameLower.includes('okx')) return '/wallets/okx.png';
    if (nameLower.includes('backpack')) return '/wallets/backpack.png';
    return null;
  };

  const getWalletDescription = (name: string) => {
    if (name.includes('Base')) return 'Native Base wallet';
    if (name.includes('MetaMask')) return 'Popular';
    if (name.includes('Rabby')) return 'Multi-chain';
    if (name.includes('Coinbase')) return 'Easy to use';
    if (name.includes('WalletConnect')) return 'Scan with phone';
    return 'Connect wallet';
  };

  return (
    <div style={{ minHeight: '100vh', background: currentColor.bg, padding: '24px', transition: 'background 0.3s' }}>
      <div className="container">
        <div className="header">
          <h1>Base Habit Tracker</h1>
          <p>Track your daily habits on-chain</p>
        </div>

        {/* Wallet Connection Button */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          {!isConnected ? (
            <button
              onClick={() => setShowWalletModal(true)}
              style={{
                padding: '12px 24px',
                background: '#0052FF',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(0,82,255,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#0041CC'}
              onMouseOut={(e) => e.currentTarget.style.background = '#0052FF'}
            >
              Connect Wallet
            </button>
          ) : (
            <div style={{
              padding: '12px 20px',
              background: 'white',
              border: '2px solid #0052FF',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#22c55e',
                borderRadius: '50%'
              }} />
              <span style={{ fontWeight: '600', color: '#1f2937' }}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Wallet Modal */}
        {showWalletModal && !isConnected && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setShowWalletModal(false)}
          >
            <div
              style={{
                background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '440px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                  Connect a Wallet
                </h3>
                <button
                  onClick={() => setShowWalletModal(false)}
                  style={{
                    background: '#f3f4f6',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                >
                  ×
                </button>
              </div>
              
              <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
                Choose how you want to connect. There are several wallet providers.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {connectors.map((connector) => {
                  const iconPath = getWalletIcon(connector.name);
                  
                  return (
                    <button
                      key={connector.id}
                      onClick={() => {
                        connect({ connector, chainId: base.id });
                        setShowWalletModal(false);
                      }}
                      style={{
                        padding: '20px',
                        background: 'white',
                        border: '2px solid #e5e7eb',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#0052FF';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,82,255,0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                      }}
                    >
                      {iconPath ? (
                        <img 
                          src={iconPath} 
                          alt={connector.name}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '8px',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: '#f3f4f6',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}>
                          💼
                        </div>
                      )}
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                          {connector.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '400' }}>
                          {getWalletDescription(connector.name)}
                        </div>
                      </div>
                      <span style={{ fontSize: '20px', color: '#9ca3af' }}>→</span>
                    </button>
                  );
                })}
              </div>
              
              <p style={{ 
                marginTop: '24px', 
                fontSize: '12px', 
                color: '#9ca3af', 
                textAlign: 'center',
                lineHeight: '1.5'
              }}>
                By connecting a wallet, you agree to Base&apos;s Terms of Service
              </p>
            </div>
          </div>
        )}

        {/* Add Habit Modal */}
        {showAddHabitModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => {
              setShowAddHabitModal(false);
              setNewHabitName('');
              setSelectedColorIndex(0);
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '440px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937', marginBottom: '8px' }}>
                  Add New Habit
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  Create a new habit to track daily
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Morning Exercise, Read 30 min"
                  onKeyPress={(e) => e.key === 'Enter' && addNewHabit()}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#0052FF'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Choose Color
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '12px' 
                }}>
                  {HABIT_COLORS.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColorIndex(index)}
                      style={{
                        padding: '16px',
                        background: color.bg,
                        border: selectedColorIndex === index ? `3px solid ${color.button}` : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        transform: selectedColorIndex === index ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: color.button,
                        borderRadius: '8px'
                      }} />
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowAddHabitModal(false);
                    setNewHabitName('');
                    setSelectedColorIndex(0);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                >
                  Cancel
                </button>
                <button
                  onClick={addNewHabit}
                  disabled={!newHabitName.trim()}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: newHabitName.trim() ? HABIT_COLORS[selectedColorIndex].button : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: newHabitName.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  Add Habit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Habit Tabs */}
        <div className="habit-tabs">
          {habits.map((habit, index) => (
            <button
              key={habit.id}
              onClick={() => setCurrentHabitIndex(index)}
              className={`habit-tab ${index === currentHabitIndex ? 'active' : ''}`}
              style={{
                background: index === currentHabitIndex ? HABIT_COLORS[habit.colorIndex].button : 'white',
                color: index === currentHabitIndex ? 'white' : '#374151',
                borderColor: index === currentHabitIndex ? HABIT_COLORS[habit.colorIndex].button : '#d1d5db'
              }}
            >
              {habit.name}
            </button>
          ))}
          
          <button 
            onClick={() => setShowAddHabitModal(true)}
            className="habit-tab"
            style={{ borderStyle: 'dashed' }}
          >
            + Add Habit
          </button>
        </div>

        <div 
          className="habit-card"
          style={{ borderColor: currentColor.border }}
        >
          <h2>{currentHabit.name}</h2>
          
          <div className="month-title">
            {new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </div>

          <div className="calendar">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
            
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {getDaysArray().map(day => {
              const isToday = day === today.getDate();
              const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              
              return (
                <DayCell
                  key={day}
                  day={day}
                  isToday={isToday}
                  isPast={isPast}
                  habitId={currentHabit.id}
                  address={address}
                  dateTimestamp={getDateTimestamp(day)}
                  onCheckIn={() => handleCheckIn(day)}
                  isPending={isPending}
                  currentColor={currentColor}
                  isConnected={isConnected}
                />
              );
            })}
          </div>
        </div>

        <div className="info-box">
          <p><strong>{isConnected ? 'Ready to check-in!' : 'Connect wallet to start'}</strong></p>
          <p>Each check-in costs 0.00001 ETH (~1 cent)</p>
          <p>Contract: {CONTRACT_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
}

// Day Cell Component with contract reading
function DayCell({ 
  day, 
  isToday, 
  isPast, 
  habitId, 
  address, 
  dateTimestamp,
  onCheckIn,
  isPending,
  currentColor,
  isConnected
}: { 
  day: number;
  isToday: boolean;
  isPast: boolean;
  habitId: number;
  address: string | undefined;
  dateTimestamp: number;
  onCheckIn: () => void;
  isPending: boolean;
  currentColor: any;
  isConnected: boolean;
}) {
  // Read from contract
  const { data: isChecked } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasCheckedIn',
    args: address ? [address as `0x${string}`, BigInt(habitId), BigInt(dateTimestamp)] : undefined,
    query: {
      enabled: !!address
    }
  });

  const canCheckIn = isToday && !isChecked && isConnected && !isPending;

  return (
    <div
      className={`day-cell ${isToday ? 'today' : ''} ${isPast && !isChecked ? 'past' : ''}`}
      style={{
        background: isChecked ? currentColor.button : 'white',
        borderColor: isToday ? '#3b82f6' : '#e5e7eb',
        color: isChecked ? 'white' : '#1f2937'
      }}
    >
      <div className="day-number">{day}</div>
      
      {canCheckIn && (
        <button
          onClick={onCheckIn}
          disabled={isPending}
          className="check-button"
          style={{ background: currentColor.button }}
        >
          {isPending ? '...' : 'Check-in'}
        </button>
      )}
      
      {isChecked && <div className="checkmark">✓</div>}
    </div>
  );
}