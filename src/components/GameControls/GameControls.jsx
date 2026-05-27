import { useState, useEffect } from 'react'
import { GAME_CONFIG } from '../../config/gameConfig'
import './GameControls.css'

function GameControls({ onDrop }) {
  const [betAmount, setBetAmount] = useState(GAME_CONFIG.defaultBet)
  const [ballsAmount, setBallsAmount] = useState(1)
  const [autoAmount, setAutoAmount] = useState(0)
  const [playerBalance, setPlayerBalance] = useState(GAME_CONFIG.defaultBalance)

  const handleBetIncrease = () => {
    setBetAmount((prev) => Math.min(prev + 0.5, 100))
  }

  const handleBetDecrease = () => {
    setBetAmount((prev) => Math.max(prev - 0.5, 0.5))
  }

  const handleBallsIncrease = () => {
    setBallsAmount((prev) => Math.min(prev + 1, 10))
  }

  const handleBallsDecrease = () => {
    setBallsAmount((prev) => Math.max(prev - 1, 1))
  }

  const handleAutoIncrease = () => {
    setAutoAmount((prev) => prev + 10)
  }

  const handleAutoDecrease = () => {
    setAutoAmount((prev) => Math.max(prev - 10, 0))
  }

  // Track player balance changes
  useEffect(() => {
    const updateBalance = () => {
      if (window.getPlayerBalance) {
        setPlayerBalance(window.getPlayerBalance())
      }
    }

    // Update balance initially
    updateBalance()

    // Set up interval to check balance
    const interval = setInterval(updateBalance, 100)

    return () => clearInterval(interval)
  }, [])

  const handleDrop = () => {
    // Check if insufficient balance
    if (playerBalance < betAmount) {
      return
    }

    // Deduct bet from balance
    if (window.setPlayerBalance) {
      const currentBalance = window.getPlayerBalance ? window.getPlayerBalance() : playerBalance
      if (currentBalance >= betAmount) {
        window.setPlayerBalance(currentBalance - betAmount)
        setPlayerBalance(currentBalance - betAmount)

        // Trigger ball drop
        if (onDrop) {
          onDrop(betAmount, ballsAmount)
        }
      }
    }
  }

  // Check if button should be disabled
  const isButtonDisabled = playerBalance < betAmount

  return (
    <div className="game-controls-wrapper">
      <div className="game-controls">
      {/* Buy Features Section */}
      <div className="control-section buy-features">
        <div className="section-title">
          <span>BUY FEATURES</span>
        </div>
        <div className="features-buttons">
          <button disabled className="feature-btn" type="button">
            <img
              src="/assets/images/buy-features/high_ball_chance.png_100.webp"
              alt="High Ball Chance"
            />
          </button>
          <button disabled className="feature-btn" type="button">
            <img
              src="/assets/images/buy-features/one_more_spin.png_100.webp"
              alt="One More Spin"
            />
          </button>
          <button disabled className="feature-btn" type="button">
            <img
              src="/assets/images/buy-features/threshold.png_100.webp"
              alt="Threshold"
            />
          </button>
        </div>
      </div>

      {/* Bet Amount Section */}
      <div className="control-section bet-amount">
        <div className="section-title">
          <span>BET AMOUNT</span>
        </div>
        <div className="control-input">
          <button disabled className="control-arrow left" onClick={handleBetDecrease} type="button">
            <img
              src="/assets/images/bet-trigger/left_arrow_active.png_80_90.png"
              alt="Decrease"
            />
          </button>
          <div className="control-value">
            <span>{betAmount.toFixed(2)}</span>
          </div>
          <button disabled className="control-arrow right" onClick={handleBetIncrease} type="button">
            <img
              src="/assets/images/bet-trigger/right_arrow_active.png_80_90.png"
              alt="Increase"
            />
          </button>
        </div>
      </div>

      {/* Balls Amount Section */}
      <div className="control-section balls-amount">
        <div className="section-title">
          <span>BALLS AMOUNT</span>
        </div>
        <div className="control-input">
          <button disabled className="control-arrow left" onClick={handleBallsDecrease} type="button">
            <img
              src="/assets/images/bet-trigger/left_arrow_active.png_80_90.png"
              alt="Decrease"
            />
          </button>
          <div className="control-value">
            <span>{ballsAmount}</span>
          </div>
          <button disabled className="control-arrow right" onClick={handleBallsIncrease} type="button">
            <img
              src="/assets/images/bet-trigger/right_arrow_active.png_80_90.png"
              alt="Increase"
            />
          </button>
        </div>
      </div>

      {/* Auto Section */}
      <div className="control-section auto-amount">
        <div className="section-title">
          <span>AUTO</span>
        </div>
        <div className="control-input">
          <button disabled className="control-arrow left" onClick={handleAutoDecrease} type="button">
            <img
              src="/assets/images/autoplay/left_arrow_active.png_80_90.png"
              alt="Decrease"
            />
          </button>
          <div className="control-value">
            <span>{autoAmount}</span>
          </div>
          <button disabled className="control-arrow right" onClick={handleAutoIncrease} type="button">
            <img
              src="/assets/images/autoplay/right_arrow_active.png_80_90.png"
              alt="Increase"
            />
          </button>
        </div>
      </div>
      </div>

      {/* Play Button */}
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" className="penta">
        <polygon
          points="150,20 280,110 230,270 70,270 20,110"
          fill="none"
          stroke="#8bebf2"
          strokeWidth="5"
        />
      </svg>
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" className="pentaN">
        <polygon
          points="150,20 280,110 270,270 70,270 20,110"
          fill="none"
          stroke="#f37cf5"
          strokeWidth="5"
        />
      </svg>
      <button id="drop-button" type="button" onClick={handleDrop} disabled={isButtonDisabled}>
        {GAME_CONFIG.spinButtonLabel}
      </button>
    </div>
  )
}

export default GameControls