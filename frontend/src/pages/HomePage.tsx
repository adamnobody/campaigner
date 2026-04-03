import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Chip,
  Container,
  Avatar,
  Fade,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PaletteIcon from '@mui/icons-material/Palette';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MapIcon from '@mui/icons-material/Map';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useUIStore } from '@/store/useUIStore';
import { projectsApi } from '@/api/axiosClient';
import { DndButton } from '@/components/ui/DndButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { usePreferencesStore } from '@/store/usePreferencesStore';

// ============================================
// 🎭 ANIMATED COMPONENTS
// ============================================

// ✅ ИСПРАВЛЕННЫЙ ТИП: теперь поддерживает все стороны
interface PositionProps {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

const AnimatedGradientOrb: React.FC<{
  color: string;
  size?: number;
} & PositionProps & { delay?: number }> = ({ 
  color, 
  size = 400, 
  top, 
  right, 
  bottom, 
  left, 
  delay = 0 
}) => (
  <Box
    sx={{
      position: 'absolute',
      width: size,
      height: size,
      ...(top && { top }),
      ...(right && { right }),
      ...(bottom && { bottom }),
      ...(left && { left }),
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(60px)',
      opacity: 0.4,
      animation: `float ${8 + delay}s ease-in-out infinite`,
      pointerEvents: 'none',
      zIndex: 0,
      '@keyframes float': {
        '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
        '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
        '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
      },
    }}
  />
);

const MagicParticles: React.FC = () => (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
      '&::before, &::after': {
        content: '""',
        position: 'absolute',
        width: '2px',
        height: '2px',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: '50%',
        boxShadow: `
          100px 200px 0 0 rgba(201,169,89,0.8),
          300px 100px 0 0 rgba(155,124,255,0.6),
          500px 300px 0 0 rgba(78,205,196,0.7),
          700px 150px 0 0 rgba(214,93,93,0.5),
          200px 500px 0 0 rgba(80,200,120,0.6),
          600px 450px 0 0 rgba(230,162,60,0.7),
          900px 250px 0 0 rgba(214,132,164,0.5)
        `,
        animation: 'twinkle 12s ease-in-out infinite alternate',
      },
      '&::after': {
        boxShadow: `
          150px 350px 0 0 rgba(201,169,89,0.5),
          400px 250px 0 0 rgba(96,122,255,0.7),
          650px 400px 0 0 rgba(180,190,210,0.6),
          850px 350px 0 0 rgba(90,170,160,0.5),
          250px 150px 0 0 rgba(214,93,93,0.4)
        `,
        animationDelay: '6s',
      },
      '@keyframes twinkle': {
        '0%': { opacity: 0.3, transform: 'scale(1)' },
        '100%': { opacity: 1, transform: 'scale(1.2)' },
      },
    }}
  />
);

// ✅ ИСПРАВЛЕННЫЙ ТИП: теперь принимает любой объект позиции
const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  position: PositionProps;
  delay?: number;
}> = ({ icon, position, delay = 0 }) => (
  <Box
    sx={{
      position: 'absolute',
      ...position,
      opacity: 0.08,
      fontSize: '8rem',
      color: 'primary.main',
      animation: `gentleFloat ${10 + delay}s ease-in-out infinite`,
      pointerEvents: 'none',
      zIndex: 0,
      '@keyframes gentleFloat': {
        '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
        '50%': { transform: 'translateY(-20px) rotate(3deg)' },
      },
    }}
  >
    {icon}
  </Box>
);

// ============================================
// 🎨 GLASSMORPHISM CARD COMPONENT
// ============================================

const GlassCard: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  sx?: any;
  elevation?: number;
}> = ({ children, onClick, sx = {}, elevation = 0 }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={elevation}
      onClick={onClick}
      sx={{
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.7)} 0%, 
          ${alpha(theme.palette.background.paper, 0.4)} 100%
        )`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        borderRadius: 3,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: '1px',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.2)} 0%, 
            transparent 50%, 
            ${alpha(theme.palette.secondary.main, 0.1)} 100%
          )`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.4s ease',
        },
        '&:hover': {
          transform: 'translateY(-4px) scale(1.01)',
          borderColor: alpha(theme.palette.primary.main, 0.4),
          boxShadow: `
            0 20px 40px ${alpha(theme.palette.common.black, 0.3)},
            0 0 60px ${alpha(theme.palette.primary.main, 0.08)}
          `,
          '&::before': { opacity: 1 },
        },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

// ============================================
// ✨ EMPTY STATE WITH ILLUSTRATION
// ============================================

const EmptyStateIllustration: React.FC = () => (
  <Box
    sx={{
      position: 'relative',
      width: 280,
      height: 220,
      mx: 'auto',
      mb: 3,
    }}
  >
    {/* Central Book */}
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '6rem',
        color: 'primary.main',
        opacity: 0.15,
        animation: 'bookPulse 4s ease-in-out infinite',
        '@keyframes bookPulse': {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.05)' },
        },
      }}
    >
      <ImportContactsIcon sx={{ fontSize: 'inherit' }} />
    </Box>

    {/* Orbiting Icons */}
    <Box
      sx={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        fontSize: '2.5rem',
        color: 'secondary.main',
        opacity: 0.2,
        animation: 'orbit1 8s linear infinite',
        '@keyframes orbit1': {
          '0%': { transform: 'rotate(0deg) translateX(90px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(90px) rotate(-360deg)' },
        },
      }}
    >
      <MapIcon />
    </Box>
    
    <Box
      sx={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        fontSize: '2rem',
        color: 'primary.main',
        opacity: 0.2,
        animation: 'orbit2 10s linear infinite reverse',
        '@keyframes orbit2': {
          '0%': { transform: 'rotate(0deg) translateX(75px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(75px) rotate(-360deg)' },
        },
      }}
    >
      <AccountTreeIcon />
    </Box>

    {/* Sparkles */}
    {[...Array(6)].map((_, i) => (
      <Box
        key={i}
        sx={{
          position: 'absolute',
          width: 4,
          height: 4,
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          top: `${20 + Math.random() * 60}%`,
          left: `${20 + Math.random() * 60}%`,
          opacity: 0.4,
          animation: `sparkle ${2 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
          '@keyframes sparkle': {
            '0%, 100%': { opacity: 0.2, transform: 'scale(1)' },
            '50%': { opacity: 0.8, transform: 'scale(1.5)' },
          },
        }}
      />
    ))}
  </Box>
);

// ============================================
// 🚀 MAIN HOMEPAGE COMPONENT
// ============================================

export const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();
  const { homeBackgroundImage, homeBackgroundOpacity } = usePreferencesStore();

  // State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchProjects();
    // Trigger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  // Handlers (preserved exactly as original)
  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const project = await createProject({
        name: newName.trim(),
        description: newDescription.trim(),
      });

      setCreateDialogOpen(false);
      setNewName('');
      setNewDescription('');
      showSnackbar('✨ Проект создан!', 'success');
      navigate(`/project/${project.id}/map`);
    } catch {
      showSnackbar('Не удалось создать проект', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmDialog(
      'Удалить проект',
      `Вы уверены, что хотите удалить "${name}"? Это действие нельзя отменить.`,
      async () => {
        try {
          await deleteProject(id);
          showSnackbar('Проект удалён', 'success');
        } catch {
          showSnackbar('Не удалось удалить', 'error');
        }
      }
    );
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !data.project) {
          showSnackbar('Неверный формат файла. Ожидается экспорт Campaigner.', 'error');
          return;
        }

        const res = await projectsApi.importProject(data);
        showSnackbar(`📥 Проект "${res.data.data.name}" импортирован!`, 'success');
        fetchProjects();
        navigate(`/project/${res.data.id}/map`);
      } catch (err: any) {
        if (err instanceof SyntaxError) {
          showSnackbar('Файл не является валидным JSON', 'error');
        } else {
          showSnackbar(err.message || 'Ошибка импорта', 'error');
        }
      }
    };

    input.click();
  };

  if (loading && projects.length === 0) {
    return <LoadingScreen message="Загрузка кампаний..." />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: theme.palette.background.default,
      }}
    >
      {/* ========================================== */}
      {/* 🌌 ATMOSPHERIC BACKGROUND LAYERS         */}
      {/* ========================================== */}
      
      {/* Custom Background Image */}
      {homeBackgroundImage && (
        <Fade in={!!homeBackgroundImage} timeout={1000}>
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              backgroundImage: `url(${homeBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: homeBackgroundOpacity,
              transform: 'scale(1.02)',
              transition: 'opacity 1s ease',
            }}
          />
        </Fade>
      )}

      {/* Animated Gradient Orbs */}
      <AnimatedGradientOrb 
        color={alpha(theme.palette.primary.main, 0.3)} 
        size={500} 
        top="10%" 
        left="15%" 
      />
      <AnimatedGradientOrb 
        color={alpha(theme.palette.secondary.main, 0.2)} 
        size={400} 
        top="60%" 
        right="10%" 
        delay={2}
      />
      <AnimatedGradientOrb 
        color={alpha(theme.palette.primary.main, 0.15)} 
        size={300} 
        bottom="20%" 
        left="40%" 
        delay={4}
      />

      {/* Magic Particles Effect */}
      <MagicParticles />

      {/* Floating Decorative Icons */}
      <FloatingIcon icon={<AutoAwesomeIcon />} position={{ top: '15%', right: '10%' }} delay={0} />
      <FloatingIcon icon={<MapIcon />} position={{ bottom: '25%', left: '8%' }} delay={3} />

      {/* Gradient Overlay for Readability */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: homeBackgroundImage
            ? `linear-gradient(
                180deg,
                ${alpha(theme.palette.background.default, 0.85)} 0%,
                ${alpha(theme.palette.background.default, 0.65)} 40%,
                ${alpha(theme.palette.background.default, 0.9)} 100%
              )`
            : `linear-gradient(
                180deg,
                ${alpha(theme.palette.background.default, 0.75)} 0%,
                ${alpha(theme.palette.background.default, 0.55)} 45%,
                ${alpha(theme.palette.background.default, 0.88)} 100%
              )`,
        }}
      />

      {/* ========================================== */}
      {/* 📱 MAIN CONTENT                           */}
      {/* ========================================== */}

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Hero Section with Animation */}
        <Container maxWidth="md" sx={{ pt: { xs: 6, md: 10 }, pb: 3 }}>
          <Box
            sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Logo / Title with Glow Effect */}
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Typography
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 900,
                  fontSize: { xs: '2.8rem', md: '4.5rem' },
                  background: `linear-gradient(135deg, 
                    ${theme.palette.text.primary} 0%, 
                    ${theme.palette.primary.main} 50%, 
                    ${theme.palette.text.primary} 100%
                  )`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                  letterSpacing: '0.03em',
                  textShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                  position: 'relative',
                  '&::after': {
                    content: '"Campaigner"',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: `linear-gradient(135deg, 
                      ${theme.palette.text.primary} 0%, 
                      ${theme.palette.primary.main} 50%, 
                      ${theme.palette.text.primary} 100%
                    )`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: 0.3,
                    filter: 'blur(8px)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                Campaigner
              </Typography>
              
              {/* Decorative Line */}
              <Box
                sx={{
                  mt: 1.5,
                  width: 120,
                  height: 3,
                  background: `linear-gradient(90deg, 
                    ${theme.palette.primary.main} 0%, 
                    transparent 100%
                  )`,
                  borderRadius: 2,
                  boxShadow: `0 0 10px ${theme.palette.primary.main}`,
                }}
              />
            </Box>

            {/* Subtitle with Typewriter Effect Feel */}
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mt: 2.5,
                maxWidth: 700,
                fontSize: { xs: '1.05rem', md: '1.15rem' },
                lineHeight: 1.6,
                letterSpacing: '0.01em',
                opacity: isLoaded ? 1 : 0,
                transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${0.2}s`,
              }}
            >
              Среда для создания интерактивных карт, заметок, связей и истории вашего мира.
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  ml: 0.5,
                }}
              >
                ✦
              </Box>
            </Typography>
          </Box>
        </Container>

        {/* Projects Section */}
        <Container maxWidth="md" sx={{ pt: 4, pb: 4, flexGrow: 1 }}>
          {/* Section Header with Actions */}
          <Box
            sx={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${0.3}s`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 3,
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 4,
                    height: 24,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  }}
                />
                Проекты
                <Chip
                  label={projects.length}
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.primary.main,
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    height: 24,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                />
              </Typography>
            </Box>

            <Box display="flex" gap={1.5} flexWrap="wrap">
              <DndButton
                variant="outlined"
                startIcon={<PaletteIcon />}
                onClick={() => navigate('/appearance')}
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Внешний вид
              </DndButton>

              <DndButton
                variant="outlined"
                startIcon={<FileUploadIcon />}
                onClick={handleImportClick}
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  borderColor: alpha(theme.palette.info.main, 0.4),
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: theme.palette.info.main,
                    backgroundColor: alpha(theme.palette.info.main, 0.08),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Импорт
              </DndButton>

              <DndButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                }}
              >
                Создать проект
              </DndButton>
            </Box>
          </Box>

          {/* Projects List with Staggered Animation */}
          <Box display="flex" flexDirection="column" gap={2}>
            {projects.map((project, index) => (
              <GlassCard
                key={project.id}
                onClick={() => navigate(`/project/${project.id}/map`)}
                sx={{
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${0.4 + index * 0.1}s`,
                  px: 3.5,
                  py: 2.8,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
                  {/* Project Info */}
                  <Box sx={{ minWidth: 0, flexGrow: 1, pr: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      {/* Project Avatar/Icon */}
                      <Avatar
                        sx={{
                          width: 42,
                          height: 42,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          fontFamily: '"Cinzel", serif',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                        }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </Avatar>
                      
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            color: 'text.primary',
                            letterSpacing: '0.02em',
                            transition: 'color 0.3s ease',
                            '.MuiPaper-root:hover &': {
                              color: theme.palette.primary.main,
                            },
                          }}
                          noWrap
                        >
                          {project.name}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Status & Description Row */}
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                      <Chip
                        label={
                          project.status === 'active' 
                            ? '⚡ Активный' 
                            : String(project.status)
                        }
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.success.main, 0.12),
                          color: theme.palette.success.main,
                          fontSize: '0.72rem',
                          height: 24,
                          fontWeight: 700,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
                          letterSpacing: '0.03em',
                        }}
                      />

                      {project.description && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.82rem',
                            lineHeight: 1.4,
                            maxWidth: 400,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {project.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    onClick={(e) => handleDelete(project.id, project.name, e)}
                    sx={{
                      color: alpha(theme.palette.text.primary, 0.25),
                      flexShrink: 0,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        color: theme.palette.error.main,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1) rotate(90deg)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </GlassCard>
            ))}
          </Box>

          {/* Enhanced Empty State */}
          {projects.length === 0 && (
            <GlassCard
              sx={{
                mt: 2,
                textAlign: 'center',
                py: 8,
                px: 4,
                opacity: isLoaded ? 1 : 0,
                transition: `all 0.8s ease ${0.6}s`,
              }}
            >
              <EmptyStateIllustration />
              
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 1,
                  letterSpacing: '0.02em',
                }}
              >
                Ваш мир ждёт своего творца
              </Typography>
              
              <Typography
                variant="body1"
                sx={{ 
                  color: 'text.secondary', 
                  mb: 3,
                  maxWidth: 420,
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                Создайте первый проект, чтобы начать увлекательное путешествие по построению вашей вселенной.
              </Typography>

              <DndButton
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                }}
              >
                ⚔️ Создать первый проект
              </DndButton>
            </GlassCard>
          )}
        </Container>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Footer with Glass Effect */}
        <Fade in={isLoaded} timeout={1000}>
          <Container maxWidth="md">
            <GlassCard
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2.5,
                px: 3,
                mb: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderRadius: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    fontFamily: '"Cinzel", serif',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  C
                </Avatar>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Cinzel", serif',
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: '0.95rem',
                      lineHeight: 1.2,
                    }}
                  >
                    Campaigner
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                    Среда для создания миров
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.7),
                    fontSize: '0.72rem',
                    letterSpacing: '0.03em',
                  }}
                >
                  © {new Date().getFullYear()} · Сделано с ✦ для творцов
                </Typography>
              </Box>
            </GlassCard>
          </Container>
        </Fade>
      </Box>

      {/* ========================================== */}
      {/* 💫 CREATE PROJECT DIALOG (ENHANCED)       */}
      {/* ========================================== */}
      
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, 
              ${theme.palette.background.paper} 0%, 
              ${alpha(theme.palette.background.paper, 0.95)} 100%
            )`,
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: `0 25px 50px ${alpha(theme.palette.common.black, 0.5)}`,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, 
                ${theme.palette.primary.main}, 
                ${theme.palette.secondary.main}, 
                ${theme.palette.primary.main}
              )`,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 700,
            fontSize: '1.4rem',
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <AddIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
          </Box>
          Создать новый проект
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Название кампании"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            margin="normal"
            placeholder="например, Затерянные Рудники Фанделвера"
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.3s ease',
                '&:hover, &.Mui-focused': {
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
          />

          <TextField
            fullWidth
            label="Описание"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Краткое описание кампании..."
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'all 0.3s ease',
                '&:hover, &.Mui-focused': {
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
          />

          {/* Quick Tips */}
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.info.main, 0.06),
              border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'info.main', fontSize: '1.2rem', mt: 0.3 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, fontSize: '0.78rem' }}>
              <strong>Совет:</strong> Хорошее название задаёт тон всему миру. Подумайте о жанре, атмосфере и главной идее вашей истории.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            color="inherit"
            sx={{
              fontWeight: 600,
              px: 2.5,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
            Отмена
          </Button>

          <DndButton
            variant="contained"
            onClick={handleCreate}
            loading={creating}
            disabled={!newName.trim()}
            sx={{
              fontWeight: 700,
              px: 3,
              minWidth: 120,
              background: !newName.trim() 
                ? undefined 
                : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: !newName.trim() 
                ? undefined 
                : `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            {creating ? 'Создание...' : '✨ Создать'}
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};