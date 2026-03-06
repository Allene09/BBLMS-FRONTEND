import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FiBook, FiUsers, FiArrowRightCircle, FiAlertTriangle,
  FiCalendar, FiTruck, FiCheckCircle, FiDollarSign
} from 'react-icons/fi';

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((res) => {
      setStats(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><p className="text-gray-500">Loading dashboard...</p></div>;
  if (!stats) return <div className="text-red-500 p-4">Failed to load dashboard data.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiBook} label="Total Books" value={stats.totalBooks} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={FiUsers} label="Borrowers" value={stats.totalBorrowers} color="text-green-600" bgColor="bg-green-100" />
        <StatCard icon={FiArrowRightCircle} label="Active Loans" value={stats.activeLoans} color="text-amber-600" bgColor="bg-amber-100" />
        <StatCard icon={FiAlertTriangle} label="Overdue" value={stats.overdueLoans} color="text-red-600" bgColor="bg-red-100" />
        <StatCard icon={FiCalendar} label="Reservations" value={stats.activeReservations} color="text-purple-600" bgColor="bg-purple-100" />
        <StatCard icon={FiTruck} label="Suppliers" value={stats.totalSuppliers} color="text-indigo-600" bgColor="bg-indigo-100" />
        <StatCard icon={FiCheckCircle} label="Returned" value={stats.totalReturned} color="text-emerald-600" bgColor="bg-emerald-100" />
        <StatCard icon={FiDollarSign} label="Total Fines" value={`₱${stats.totalFines.toFixed(2)}`} color="text-orange-600" bgColor="bg-orange-100" />
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</h2>
        {stats.recentLoans.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Loan Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="font-medium">{loan.book_title}</td>
                    <td>{loan.borrower_name}</td>
                    <td>{loan.loan_date}</td>
                    <td>{loan.due_date}</td>
                    <td>
                      <span className={`badge badge-${loan.status.toLowerCase()}`}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
