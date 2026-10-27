// Pink icon tile + big number + label ("1 Active application")
export default function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon">
        <Icon size={20} />
      </span>
      <div>
        <p className="stat-card__value">{value}</p>
        <p className="stat-card__label">{label}</p>
      </div>
    </div>
  );
}
