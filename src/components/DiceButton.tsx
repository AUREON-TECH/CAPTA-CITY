type DiceButtonProps = {
  disabled: boolean
  onRoll: () => void
}

export default function DiceButton({ disabled, onRoll }: DiceButtonProps) {
  return (
    <button className="dice-button" type="button" onClick={onRoll} disabled={disabled}>
      <span aria-hidden="true">🎲</span>
      <strong>RODAR DADOS</strong>
      <small>{disabled ? 'Encerre o turno para continuar' : 'Sua vez — boa sorte!'}</small>
    </button>
  )
}
