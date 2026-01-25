import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ErrorMessage from '../components/ErrorMessage.jsx';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Access codes do not match parity check');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await register(formData.name, formData.email, formData.password);
      if (response.success) {
        navigate('/');
      } else {
        setError(response.error || 'Onboarding cycle failed');
      }
    } catch (err) {
      setError('Secure registry node inaccessible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#eae0d5] uppercase tracking-tighter italic">Entity Registry</h1>
          <p className="text-[10px] text-[#5e503f] font-black tracking-[0.3em] uppercase mt-3">Formal Personnel Onboarding</p>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <Card className="p-10 border-[#5e503f]/20 bg-[#22333b]/40 shadow-2xl" hover={false}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <Input
              label="FORMAL NAME"
              type="text"
              placeholder="e.g. MARCUS AURELIUS"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="IDENTIFIER (EMAIL)"
              type="email"
              placeholder="name@organization.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="ACCESS CODE"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Input
                label="CONFIRM CODE"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full py-4 tracking-[0.3em] text-xs font-black shadow-none ring-1 ring-[#c6ac8f]/20"
                isLoading={loading}
                disabled={loading}
              >
                INITIALIZE REGISTRY CYCLE
              </Button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-[#5e503f]/20 text-center">
            <p className="text-[10px] font-black text-[#5e503f] uppercase tracking-widest">
              Existing identity?
              <Link to="/login" className="text-[#c6ac8f] hover:text-[#eae0d5] ml-2 transition-colors underline">
                SECURE ACCESS
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
