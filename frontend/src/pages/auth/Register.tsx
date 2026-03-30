import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, number'),
  confirmPassword: z.string(),
  role: z.enum(['patient', 'doctor']),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { role: 'patient' },
    });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data }; // ✅ include confirmPassword

      console.log("SENDING DATA:", payload);

      const res = await api.post('/auth/register', payload);
      const { user, accessToken, refreshToken } = res.data.data;

      setAuth(user, accessToken, refreshToken);
      toast.success('Account created successfully!');

      if (user.role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/dashboard');

    } catch (err: any) {
      console.log("FULL ERROR:", JSON.stringify(err.response?.data, null, 2));

      toast.error(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        'Registration failed'
      );
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>

        <input {...register('firstName')} placeholder="First Name" />
        <p>{errors.firstName?.message}</p>

        <input {...register('lastName')} placeholder="Last Name" />
        <p>{errors.lastName?.message}</p>

        <input {...register('email')} placeholder="Email" />
        <p>{errors.email?.message}</p>

        <input {...register('password')} type="password" placeholder="Password" />
        <p>{errors.password?.message}</p>

        <input {...register('confirmPassword')} type="password" placeholder="Confirm Password" />
        <p>{errors.confirmPassword?.message}</p>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Account'}
        </button>

      </form>
    </div>
  );
};

export default Register;