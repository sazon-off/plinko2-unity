import { useEffect, useState } from 'react'
import initPlinkoGame from '../../game/initPlinkoGame'
import { GAME_CONFIG, calculateMultipliers } from '../../config/gameConfig'
import GameControls from '../GameControls/GameControls'
import './PlinkoGame.css'

function PlinkoGame() {
  const [welcomeVisible, setWelcomeVisible] = useState(true)
  const multipliers = calculateMultipliers()

  const formatAmount = (amount) =>
    GAME_CONFIG.welcomeModal.amountTemplate
      .replace('{amount}', amount)
      .replace('{currency}', GAME_CONFIG.currency)

  useEffect(() => {
    const cleanup = initPlinkoGame()
    if (typeof window !== 'undefined' && typeof window.setPlayerBalance === 'function') {
      window.setPlayerBalance(0)
    }
    return () => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [])

  const handleClaimBonus = () => {
    if (typeof window !== 'undefined' && typeof window.setPlayerBalance === 'function') {
      window.setPlayerBalance(GAME_CONFIG.defaultBalance)
    }
    setWelcomeVisible(false)
  }

  const handleDrop = (betAmount, ballsAmount) => {
    // Trigger ball drop in the game
    if (typeof window !== 'undefined' && typeof window.dropBall === 'function') {
      window.dropBall()
    }
  }

  return (
    <div className="plinko-page">
      <div className="falling-leaves-container" />

      {welcomeVisible && (
        <div className="modal show welcome-modal" id="welcome-modal">
          <div className="modal-content">
            <div className="welcome-card">
              <p className="welcome-title">{GAME_CONFIG.welcomeModal.title}</p>
              <p className="welcome-amount">{formatAmount(GAME_CONFIG.defaultBalance)}</p>
              <p className="welcome-description">{GAME_CONFIG.welcomeModal.subTitle}</p>
              <button type="button" className="welcome-action" onClick={handleClaimBonus}>
                {GAME_CONFIG.welcomeModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="modal" id="modal1">
        <div className="modal-content">
          <img className="app-logo" src="" alt="" />
          <img className="app-name" src="" alt="" />
          <div className="modal-text">
            <span>{GAME_CONFIG.finalModal.title}</span>
              <span>{GAME_CONFIG.finalModal.subTitle}</span>
            <span>{GAME_CONFIG.targetBalance}{" "}{GAME_CONFIG.currency}</span>
            <span>{GAME_CONFIG.finalModal.freeSpins}</span>
          </div>
          <img className="stars" src="" alt="" />
          <button id="finish">
            <span>{GAME_CONFIG.finalModal.installLabel}</span>
          </button>
        </div>
      </div>

      <div className="main-container">
        <div className="top-container">
          <img src="/assets/images/info.png" alt="" className="num" />
          <img src="/assets/images/info2.png" alt="" className="info" />
          <img src="/assets/images/logo.png" alt="" className="logo" />
          <div className="freespins">
            <div id="balls-wrapp">
              <div id="balls">0 {GAME_CONFIG.currency}</div>
            </div>
          </div>
          <canvas id="balls-canvas" />
          <div className="balls-enter">
            <img src="/assets/images/stick.png" alt="" className="bot-vector" />
            <img src="/assets/images/stick.png" alt="" className="middle-vector" />
            <img src="/assets/images/stick.png" alt="" className="top-vector" />
          </div>
        </div>

        <div className="canvas-container">
          <img src="/assets/images/right-wall.png" alt="" className="right-wall" />
          <img src="/assets/images/left-wall.png" alt="" className="left-wall" />
          <canvas id="canvas" />
          <div className="prizes">
            {multipliers.map((multiplier, index) => {
              // Determine color based on index
              let bgColor = null
              let showHole = false

              if (index === 2 || index === 8) {
                bgColor = '#7D7FE7'
                showHole = true
              } else if (index === 3 || index === 7) {
                bgColor = '#7D7FE7'
              } else if (index === 4 || index === 5 || index === 6) {
                bgColor = '#00E4FF'
              }

              return (
                <div key={index} className="layered-container">
                  <div className="layer layer1" style={bgColor ? { backgroundColor: bgColor } : {}} />
                  <div className="layer layer2" style={bgColor ? { backgroundColor: bgColor } : {}} />
                  <div className="layer layer3" style={bgColor ? { backgroundColor: bgColor } : {}}>
                    {showHole && <img src="/assets/images/hole.png" alt="" className="six" />}
                  </div>
                  <div className="prize">{showHole ? '' : `${multiplier}x`}</div>
                </div>
              )
            })}
          </div>
        </div>
        <GameControls onDrop={handleDrop} />
      </div>
    </div>
  )
}

export default PlinkoGame
