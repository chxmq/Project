import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ErrorMessage from '../components/ErrorMessage.jsx';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData.email, formData.password);
      if (response.success) {
        navigate('/');
      } else {
        setError(response.error || 'Authentication denied');
      }
    } catch (err) {
      setError('Connection to authentication node failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#eae0d5] uppercase tracking-tighter italic">Secure Access</h1>
          <p className="text-[10px] text-[#5e503f] font-black tracking-[0.3em] uppercase mt-3">Personnel Verification Required</p>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <Card className="p-10 border-[#5e503f]/20 bg-[#22333b]/40 shadow-2xl" hover={false}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <Input
              label="IDENTIFIER (EMAIL)"
              type="email"
              placeholder="name@organization.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="tracking-wide"
            />
            <Input
              label="ACCESS CODE (PASSWORD)"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Button
              type="submit"
              className="w-full py-4 tracking-[0.3em] text-xs font-black shadow-none ring-1 ring-[#c6ac8f]/20"
              isLoading={loading}
              disabled={loading}
            >
              INITIALIZE PROTOCOL
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#5e503f]/20 text-center">
            <p className="text-[10px] font-black text-[#5e503f] uppercase tracking-widest">
              Unregistered entity?
              <Link to="/register" className="text-[#c6ac8f] hover:text-[#eae0d5] ml-2 transition-colors underline">
                COMMENCE ONBOARDING
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
