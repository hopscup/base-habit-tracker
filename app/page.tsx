'use client';

import { useState, useEffect, useRef } from 'react';
import { sdk } from '@coinbase/onchainkit/minikit';
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';

const CONTRACT_ADDRESS = '0x9a4eaaBd5d204932E1e4d9EC0fa718Dc77B3360e';

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

// Helper functions for wallet-bound storage
const getStorageKey = (address: string | undefined) => {
  if (!address) return null;
  return `habits_${address.toLowerCase()}`;
};

const loadHabitsForWallet = (address: string | undefined): Habit[] => {
  if (typeof window === 'undefined' || !address) {
    return [{ id: 0, name: 'Daily Check-in App', colorIndex: 0 }];
  }
  
  const key = getStorageKey(address);
  if (!key) return [{ id: 0, name: 'Daily Check-in App', colorIndex: 0 }];
  
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [{ id: 0, name: 'Daily Check-in App', colorIndex: 0 }];
    }
  }
  return [{ id: 0, name: 'Daily Check-in App', colorIndex: 0 }];
};

const saveHabitsForWallet = (address: string | undefined, habits: Habit[]) => {
  if (typeof window === 'undefined' || !address) return;
  
  const key = getStorageKey(address);
  if (!key) return;
  
  localStorage.setItem(key, JSON.stringify(habits));
};

export default function HabitTracker() {
  const { address, isConnected } = useAccount();
  
  const [habits, setHabits] = useState<Habit[]>([{ id: 0, name: 'Daily Check-in App', colorIndex: 0 }]);
  const [currentHabitIndex, setCurrentHabitIndex] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showEditHabitModal, setShowEditHabitModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<number | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  // Month navigation state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  
  // Transaction and achievement states
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txMessage, setTxMessage] = useState('');
  
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, isPending } = useWriteContract();
  const { writeContract, isPending } = useWriteContract();

useEffect(() => {
  if (typeof window !== 'undefined') {
    sdk.actions.ready();
  }
}, []);

useEffect(() => {
  if (address) {
  useEffect(() => {
    if (address) {
      const loadedHabits = loadHabitsForWallet(address);
      setHabits(loadedHabits);
      setCurrentHabitIndex(0);
    } else {
      setHabits([{ id: 0, name: 'Daily Check-in App', colorIndex: 0 }]);
      setCurrentHabitIndex(0);
    }
  }, [address]);
  
  useEffect(() => {
    if (address && habits.length > 0) {
      saveHabitsForWallet(address, habits);
    }
  }, [habits, address]);
  
  const currentHabit = habits[currentHabitIndex];
  const currentColor = HABIT_COLORS[currentHabit.colorIndex];
  
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const getDateTimestamp = (day: number) => {
    return Math.floor(new Date(viewYear, viewMonth, day).getTime() / 1000 / 86400);
  };
  
  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    const today = new Date();
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    
    if (!isCurrentMonth) {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleCheckIn = async (day: number) => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      setTxStatus('pending');
      setTxMessage('Processing transaction...');
      
      const dateTimestamp = getDateTimestamp(day);
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'checkIn',
        args: [BigInt(currentHabit.id), BigInt(dateTimestamp)],
        value: parseEther('0.00001'),
        chainId: base.id
      });
      
      setTxStatus('success');
      setTxMessage('✅ Check-in successful!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setTxStatus('idle');
        setTxMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Check-in error:', error);
      setTxStatus('error');
      setTxMessage('❌ Transaction failed. Please try again.');
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setTxStatus('idle');
        setTxMessage('');
      }, 5000);
    }
  };

  const addNewHabit = () => {
    if (!newHabitName.trim()) return;
    if (!isConnected) {
      alert('Please connect your wallet to add habits!');
      return;
    }
    
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

  const openEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setNewHabitName(habit.name);
    setSelectedColorIndex(habit.colorIndex);
    setShowEditHabitModal(true);
    setOpenDropdownId(null);
  };

  const saveEditHabit = () => {
    if (!newHabitName.trim() || editingHabitId === null) return;
    
    const updatedHabits = habits.map(h => 
      h.id === editingHabitId 
        ? { ...h, name: newHabitName.trim(), colorIndex: selectedColorIndex }
        : h
    );
    
    setHabits(updatedHabits);
    setShowEditHabitModal(false);
    setNewHabitName('');
    setSelectedColorIndex(0);
    setEditingHabitId(null);
  };

  const confirmDeleteHabit = (habitId: number) => {
    if (habits.length === 1) {
      alert('You must have at least one habit!');
      return;
    }
    setDeletingHabitId(habitId);
    setShowDeleteConfirmModal(true);
    setOpenDropdownId(null);
  };

  const deleteHabit = () => {
    if (deletingHabitId === null) return;
    
    const filteredHabits = habits.filter(h => h.id !== deletingHabitId);
    setHabits(filteredHabits);
    
    if (currentHabitIndex >= filteredHabits.length) {
      setCurrentHabitIndex(filteredHabits.length - 1);
    }
    
    setShowDeleteConfirmModal(false);
    setDeletingHabitId(null);
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
    <div style={{ 
      minHeight: '100vh', 
      background: currentColor.bg, 
      padding: '16px',
      transition: 'background 0.3s' 
    }}>
      <div className="container" style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '0 8px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div className="header" style={{ margin: 0, minWidth: '200px', padding: 0 }}>
<h1 style={{ margin: 0, marginBottom: '4px', fontSize: 'clamp(24px, 5vw, 32px)', padding: 0, textAlign: 'left' }}>Base Habit Tracker</h1>
<p style={{ margin: 0, fontSize: 'clamp(12px, 3vw, 14px)', padding: 0, textAlign: 'left' }}>Track your daily habits on-chain</p>
          </div>

          <div>
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
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
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
                gap: '12px',
                whiteSpace: 'nowrap'
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
          <Modal
            title="Add New Habit"
            description="Create a new habit to track daily"
            onClose={() => {
              setShowAddHabitModal(false);
              setNewHabitName('');
              setSelectedColorIndex(0);
            }}
          >
            <HabitForm
              habitName={newHabitName}
              setHabitName={setNewHabitName}
              selectedColorIndex={selectedColorIndex}
              setSelectedColorIndex={setSelectedColorIndex}
              onSubmit={addNewHabit}
              onCancel={() => {
                setShowAddHabitModal(false);
                setNewHabitName('');
                setSelectedColorIndex(0);
              }}
              submitLabel="Add Habit"
            />
          </Modal>
        )}

        {/* Edit Habit Modal */}
        {showEditHabitModal && (
          <Modal
            title="Edit Habit"
            description="Update your habit details"
            onClose={() => {
              setShowEditHabitModal(false);
              setNewHabitName('');
              setSelectedColorIndex(0);
              setEditingHabitId(null);
            }}
          >
            <HabitForm
              habitName={newHabitName}
              setHabitName={setNewHabitName}
              selectedColorIndex={selectedColorIndex}
              setSelectedColorIndex={setSelectedColorIndex}
              onSubmit={saveEditHabit}
              onCancel={() => {
                setShowEditHabitModal(false);
                setNewHabitName('');
                setSelectedColorIndex(0);
                setEditingHabitId(null);
              }}
              submitLabel="Save Changes"
            />
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && (
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
              setShowDeleteConfirmModal(false);
              setDeletingHabitId(null);
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937', marginBottom: '8px' }}>
                  Delete Habit?
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  Are you sure you want to delete this habit? This action cannot be undone.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setDeletingHabitId(null);
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
                  onClick={deleteHabit}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Status Notification */}
        {txStatus !== 'idle' && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              padding: '16px 24px',
              background: txStatus === 'pending' ? '#f3f4f6' : txStatus === 'success' ? '#dcfce7' : '#fee2e2',
              border: `2px solid ${txStatus === 'pending' ? '#d1d5db' : txStatus === 'success' ? '#86efac' : '#fca5a5'}`,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '90%',
              animation: 'slideDown 0.3s ease-out'
            }}
          >
            {txStatus === 'pending' && (
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid #d1d5db',
                borderTop: '3px solid #6b7280',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            <span style={{ 
              fontWeight: '600', 
              color: txStatus === 'pending' ? '#374151' : txStatus === 'success' ? '#166534' : '#991b1b',
              fontSize: '15px'
            }}>
              {txMessage}
            </span>
          </div>
        )}

        <style jsx>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>

        <div className="habit-tabs" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', overflow: 'visible' }}>
          {habits.map((habit, index) => (
            <HabitTab
              key={habit.id}
              habit={habit}
              isActive={index === currentHabitIndex}
              isConnected={isConnected}
              currentColor={HABIT_COLORS[habit.colorIndex]}
              onClick={() => setCurrentHabitIndex(index)}
              onEdit={() => openEditHabit(habit)}
              onDelete={() => confirmDeleteHabit(habit.id)}
              isDropdownOpen={openDropdownId === habit.id}
              setIsDropdownOpen={(isOpen) => setOpenDropdownId(isOpen ? habit.id : null)}
            />
          ))}
          
          {isConnected && (
            <button 
              onClick={() => setShowAddHabitModal(true)}
              className="habit-tab"
              style={{ 
                borderStyle: 'dashed',
                padding: '12px 24px',
                background: 'white',
                border: '2px dashed #d1d5db',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                color: '#6b7280',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#0052FF';
                e.currentTarget.style.color = '#0052FF';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              + Add Habit
            </button>
          )}
        </div>

        <div 
          className="habit-card"
          style={{ borderColor: currentColor.border }}
        >
          <h2>{currentHabit.name}</h2>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            gap: '16px'
          }}>
            <button
              onClick={goToPreviousMonth}
              style={{
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = currentColor.button;
                e.currentTarget.style.background = currentColor.bg;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = 'white';
              }}
            >
              ←
            </button>
            
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div className="month-title" style={{ margin: 0 }}>
                {new Date(viewYear, viewMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              {viewYear !== today.getFullYear() || viewMonth !== today.getMonth() ? (
                <button
                  onClick={goToToday}
                  style={{
                    marginTop: '8px',
                    padding: '4px 12px',
                    background: currentColor.bg,
                    border: `1px solid ${currentColor.button}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: currentColor.button,
                    fontWeight: '600'
                  }}
                >
                  Today
                </button>
              ) : null}
            </div>
            
            <button
              onClick={goToNextMonth}
              disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()}
              style={{
                background: (viewYear === today.getFullYear() && viewMonth === today.getMonth()) ? '#f3f4f6' : 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                padding: '10px 16px',
                cursor: (viewYear === today.getFullYear() && viewMonth === today.getMonth()) ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                transition: 'all 0.2s',
                fontWeight: 'bold',
                opacity: (viewYear === today.getFullYear() && viewMonth === today.getMonth()) ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (!(viewYear === today.getFullYear() && viewMonth === today.getMonth())) {
                  e.currentTarget.style.borderColor = currentColor.button;
                  e.currentTarget.style.background = currentColor.bg;
                }
              }}
              onMouseOut={(e) => {
                if (!(viewYear === today.getFullYear() && viewMonth === today.getMonth())) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              →
            </button>
          </div>
          
          {isConnected && (
            <MonthStats
              habitId={currentHabit.id}
              address={address}
              year={viewYear}
              month={viewMonth}
              daysInMonth={daysInMonth}
              currentColor={currentColor}
            />
          )}

          <div style={{ overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
            <div className="calendar" style={{ minWidth: '280px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
            
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {getDaysArray().map(day => {
              const cellDate = new Date(viewYear, viewMonth, day);
              const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isToday = cellDate.getTime() === todayDate.getTime();
              const isPast = cellDate < todayDate;
              
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
        </div>

        <div className="info-box">
          <p><strong>{isConnected ? 'Ready to check-in!' : 'Connect wallet to start'}</strong></p>
          <p>Each check-in costs 0.00001 ETH (~1 cent)</p>
          <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '8px' }}>
            ✅ Safe contract - Only stores check-in data on-chain
          </p>
          {isConnected && (
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
              💾 Your habits are saved to your wallet: {address?.slice(0, 8)}...{address?.slice(-6)}
            </p>
          )}
          <div style={{ 
            marginTop: '16px', 
            paddingTop: '16px', 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            <span>Built by</span>
            <a 
              href="https://x.com/hopscup" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: currentColor.button,
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <span style={{
                width: '20px',
                height: '20px',
                background: currentColor.button,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                H
              </span>
              hopscup
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitTab({ 
  habit, 
  isActive, 
  isConnected, 
  currentColor, 
  onClick, 
  onEdit, 
  onDelete,
  isDropdownOpen,
  setIsDropdownOpen
}: {
  habit: Habit;
  isActive: boolean;
  isConnected: boolean;
  currentColor: { bg: string; border: string; button: string; name: string };
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={onClick}
        style={{
          padding: '12px 24px',
          paddingRight: isConnected ? '48px' : '24px',
          background: isActive ? currentColor.button : 'white',
          color: isActive ? 'white' : '#374151',
          border: `2px solid ${isActive ? currentColor.button : '#d1d5db'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {habit.name}
      </button>
      
      {isConnected && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '6px 8px',
              borderRadius: '6px',
              color: isActive ? 'white' : '#6b7280',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              lineHeight: '1'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.3)' : '#e5e7eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6';
            }}
          >
            ⋮
          </button>

          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: '0',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 999,
                padding: '12px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Edit habit"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#fecaca';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Delete habit"
              >
                🗑️
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Modal({ 
  title, 
  description, 
  children, 
  onClose 
}: { 
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
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
      onClick={onClose}
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
            {title}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            {description}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

function HabitForm({
  habitName,
  setHabitName,
  selectedColorIndex,
  setSelectedColorIndex,
  onSubmit,
  onCancel,
  submitLabel
}: {
  habitName: string;
  setHabitName: (name: string) => void;
  selectedColorIndex: number;
  setSelectedColorIndex: (index: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
          Habit Name
        </label>
        <input
          type="text"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          placeholder="e.g., Morning Exercise, Read 30 min"
          onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
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
        gap: '8px',
maxHeight: '300px',
overflowY: 'auto',
padding: '4px' 
        }}>
          {HABIT_COLORS.map((color, index) => (
            <button
              key={index}
              onClick={() => setSelectedColorIndex(index)}
              style={{
                padding: '12px 8px',
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
          onClick={onCancel}
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
          onClick={onSubmit}
          disabled={!habitName.trim()}
          style={{
            flex: 1,
            padding: '14px',
            background: habitName.trim() ? HABIT_COLORS[selectedColorIndex].button : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: habitName.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}

// Замените функцию MonthStats на эту версию:

// Замените функцию MonthStats на эту версию:

function MonthStats({
  habitId,
  address,
  year,
  month,
  daysInMonth,
  currentColor
}: {
  habitId: number;
  address: string | undefined;
  year: number;
  month: number;
  daysInMonth: number;
  currentColor: { bg: string; border: string; button: string; name: string };
}) {
  const [stats, setStats] = useState({ totalChecked: 0, percentage: 0, currentStreak: 0 });

  // Get today's date for comparison
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  // Build array of all days to check
  const daysToCheck = Array.from({ length: lastDay }, (_, i) => i + 1);

  // Create queries for each day
  const dayQueries = daysToCheck.map(day => {
    const dateTimestamp = Math.floor(new Date(year, month, day).getTime() / 1000 / 86400);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'hasCheckedIn',
      args: address ? [address as `0x${string}`, BigInt(habitId), BigInt(dateTimestamp)] : undefined,
      query: {
        enabled: !!address
      }
    });
  });

  // Calculate stats when data changes
  useEffect(() => {
    if (!address) return;

    let checked = 0;
    let streak = 0;
    let streakActive = true;

    // Count checked days and calculate streak (from most recent backwards)
    for (let i = dayQueries.length - 1; i >= 0; i--) {
      const isChecked = dayQueries[i].data;
      
      if (isChecked) {
        checked++;
        if (streakActive) {
          streak++;
        }
      } else if (i < dayQueries.length - 1) {
        // Only break streak if it's not today (allow skipping today)
        streakActive = false;
      }
    }

    const percentage = lastDay > 0 ? Math.round((checked / lastDay) * 100) : 0;
    setStats({ totalChecked: checked, percentage, currentStreak: streak });
  }, [dayQueries.map(q => q.data).join(','), address, lastDay]);

  const { totalChecked, percentage, currentStreak } = stats;
  
  // Calculate achievements
  const achievements = [];
  if (currentStreak >= 7) achievements.push({ icon: '🔥', name: '7 Day Streak!', color: '#f97316' });
  if (currentStreak >= 30) achievements.push({ icon: '⭐', name: '30 Day Legend!', color: '#eab308' });
  if (percentage >= 100) achievements.push({ icon: '💯', name: 'Perfect Month!', color: '#22c55e' });
  if (totalChecked >= 100) achievements.push({ icon: '🏆', name: '100 Check-ins!', color: '#a855f7' });
  
  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '16px',
          background: currentColor.bg,
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: currentColor.button }}>
            {totalChecked}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Check-ins
          </div>
        </div>
        
        <div style={{
          padding: '16px',
          background: currentColor.bg,
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: currentColor.button }}>
            {percentage}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Completion
          </div>
        </div>
        
        <div style={{
          padding: '16px',
          background: currentColor.bg,
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: currentColor.button }}>
            {currentStreak} 🔥
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Day Streak
          </div>
        </div>
      </div>
      
      {achievements.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #fcd34d',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: '#78350f',
            marginRight: '8px'
          }}>
            🎉 Achievements:
          </span>
          {achievements.map((achievement, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: achievement.color,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <span style={{ fontSize: '16px' }}>{achievement.icon}</span>
              {achievement.name}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

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
  currentColor: { bg: string; border: string; button: string; name: string };
  isConnected: boolean;
}) {
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
