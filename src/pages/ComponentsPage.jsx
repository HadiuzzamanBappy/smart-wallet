import React, { useState } from 'react';
import {
  MessageSquare, Plus, Save, X, Edit, Trash,
  Check, Bell, User, Search, CreditCard, PieChart,
  ArrowRight, Heart, Calendar, Settings, AlertTriangle, Info,
  Moon, Sun
} from 'lucide-react';

// Hooks
import { useTheme } from '../hooks/useTheme';

// Base UI Components
import Button from '../components/UI/base/Button';
import GlassCard from '../components/UI/base/GlassCard';
import GlassInput from '../components/UI/base/GlassInput';
import Select from '../components/UI/base/Select';
import SectionHeader from '../components/UI/base/SectionHeader';
import Badge from '../components/UI/base/Badge';
import IconBox from '../components/UI/base/IconBox';
import Modal from '../components/UI/base/Modal';
import ConfirmDialog from '../components/UI/base/ConfirmDialog';
import Toast, { ToastContainer } from '../components/UI/base/Toast';

const ComponentsPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = Date.now();
    setToasts([...toasts, { id, type, message }]);
  };

  const removeToast = (id) => {
    setToasts(toasts.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <SectionHeader
            title="Component Library"
            subtitle="Studio Executive v2 System"
            icon={Settings}
            titleSize="text-h1"
            className="flex-1"
          />

          <GlassCard variant="flat" padding="p-2" className="flex items-center gap-2">
            <Button
              variant={!isDark ? 'filled' : 'ghost'}
              size="sm"
              onClick={toggleTheme}
              icon={Sun}
            >
              Light
            </Button>
            <Button
              variant={isDark ? 'filled' : 'ghost'}
              size="sm"
              onClick={toggleTheme}
              icon={Moon}
            >
              Dark
            </Button>
          </GlassCard>
        </div>

        {/* Buttons Section */}
        <div className="space-y-6">
          <SectionHeader title="Buttons" subtitle="Interactive Primitives" titleSize="text-h4" />

          <GlassCard variant="flat" className="space-y-8">
            <div className="space-y-4">
              <p className="text-overline opacity-60">Variants</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="filled">Filled Button</Button>
                <Button variant="soft">Soft Button</Button>
                <Button variant="outlined">Outlined Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="text">Text Button</Button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-overline opacity-60">Colors (Soft Variant)</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="soft" color="primary">Primary</Button>
                <Button variant="soft" color="secondary">Secondary</Button>
                <Button variant="soft" color="success">Success</Button>
                <Button variant="soft" color="error">Error</Button>
                <Button variant="soft" color="warning">Warning</Button>
                <Button variant="soft" color="info">Info</Button>
                <Button variant="soft" color="ink">Ink</Button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-overline opacity-60">Sizes & Icons</p>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="xsm" icon={Plus}>Extra Small</Button>
                <Button size="sm" icon={Search}>Small Button</Button>
                <Button size="md" icon={MessageSquare}>Medium Button</Button>
                <Button size="lg" icon={Save}>Large Executive</Button>
                <Button variant="icon" size="md" icon={Bell} aria-label="Notifications" />
                <Button variant="icon" size="sm" icon={Trash} color="error" aria-label="Delete" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Cards Section */}
        <div className="space-y-6">
          <SectionHeader title="Cards & Surfaces" subtitle="Glassmorphic Containers" titleSize="text-h4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard variant="card">
              <p className="text-overline mb-2">Standard Card</p>
              <p className="text-body opacity-80 text-sm">Balanced blur and shadow for primary content.</p>
            </GlassCard>
            <GlassCard variant="thick">
              <p className="text-overline mb-2">Thick Surface</p>
              <p className="text-body opacity-80 text-sm">High blur (2xl) and solid feel for modals/popovers.</p>
            </GlassCard>
            <GlassCard variant="flat">
              <p className="text-overline mb-2">Flat Item</p>
              <p className="text-body opacity-80 text-sm">Subtle background for list items and inner groups.</p>
            </GlassCard>
            <GlassCard variant="elevated">
              <p className="text-overline mb-2">Elevated Card</p>
              <p className="text-body opacity-80 text-sm">Extra depth via shadow for prominent data.</p>
            </GlassCard>
          </div>
        </div>

        {/* Inputs Section */}
        <div className="space-y-6">
          <SectionHeader title="Forms" subtitle="Input Primitives" titleSize="text-h4" />
          <GlassCard variant="flat">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <GlassInput
                  label="Standard Input"
                  placeholder="Enter text..."
                  icon={User}
                />
                <GlassInput
                  label="Error State"
                  placeholder="Invalid value"
                  error="This field is required"
                  icon={AlertTriangle}
                />
                <Select
                  label="Dropdown Select"
                  options={[
                    { value: '1', label: 'Option One' },
                    { value: '2', label: 'Option Two' },
                    { value: '3', label: 'Option Three' }
                  ]}
                  icon={PieChart}
                />
              </div>
              <div className="space-y-6">
                <GlassInput
                  label="Multiline Textarea"
                  multiline={true}
                  rows={4}
                  placeholder="Write something long..."
                  icon={Edit}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Badges Section */}
        <div className="space-y-6">
          <SectionHeader title="Badges & Icons" subtitle="Metadata Visualization" titleSize="text-h4" />
          <GlassCard variant="flat" className="space-y-10">
            <div className="space-y-4">
              <p className="text-overline opacity-60">Badges & Metadata</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge color="primary">Active</Badge>
                <Badge color="success" icon={Check}>Verified</Badge>
                <Badge color="error">Critical</Badge>
                <Badge color="warning" icon={AlertTriangle}>Pending</Badge>
                <Badge color="info">Processing</Badge>
                <Badge color="ink">Draft</Badge>
                <Badge color="paper">Subtle</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-overline opacity-60">Stat Mode (Data Pairs)</p>
              <div className="flex flex-wrap gap-4">
                <Badge label="Income" value="$4,500" color="success" />
                <Badge label="Due" value="$1,200" color="error" icon={AlertTriangle} />
                <Badge label="Items" value="24" color="ink" />
                <Badge label="ROI" value="+12.5%" color="primary" icon={Check} />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-overline opacity-60">Icon Boxes</p>
              <div className="flex flex-wrap gap-6 items-center">
                <IconBox icon={CreditCard} variant="soft" size="lg" color="primary" />
                <IconBox icon={PieChart} variant="glass" size="lg" color="secondary" />
                <IconBox icon={Heart} variant="solid" size="lg" color="error" />
                <IconBox icon={Calendar} variant="ghost" size="lg" color="ink" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Overlays Section */}
        <div className="space-y-6">
          <SectionHeader title="Overlays" subtitle="Modals & Notifications" titleSize="text-h4" />
          <GlassCard variant="flat">
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setIsModalOpen(true)} variant="outlined">Open Modal</Button>
              <Button onClick={() => setIsConfirmOpen(true)} variant="outlined" color="error">Open Confirm Dialog</Button>
              <Button onClick={() => addToast('success', 'Operation completed successfully!')} color="success">Show Success Toast</Button>
              <Button onClick={() => addToast('error', 'Something went wrong.')} color="error">Show Error Toast</Button>
            </div>
          </GlassCard>
        </div>

        {/* Typography Section */}
        <div className="space-y-6">
          <SectionHeader title="Typography" subtitle="The Studio Executive Scale" titleSize="text-h4" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Font Scale */}
            <GlassCard variant="thick" className="space-y-4 divide-y divide-paper-200 dark:divide-paper-900/10">
              <div className="pb-4 pt-2"><p className="text-overline opacity-40 mb-4">Heading Scale</p></div>
              <div className="py-4"><p className="text-h1">Heading One (36px)</p></div>
              <div className="py-4"><p className="text-h2">Heading Two (30px)</p></div>
              <div className="py-4"><p className="text-h3">Heading Three (24px)</p></div>
              <div className="py-4"><p className="text-h4">Heading Four (20px)</p></div>
              <div className="py-4"><p className="text-h5">Heading Five (18px)</p></div>
              <div className="py-4"><p className="text-h6">Heading Six (16px)</p></div>
            </GlassCard>

            <div className="space-y-6">
              {/* UI Tokens */}
              <GlassCard variant="thick" className="space-y-4 divide-y divide-paper-200 dark:divide-paper-900/10">
                <div className="pb-4 pt-2"><p className="text-overline opacity-40 mb-4">UI & Data Tokens</p></div>
                <div className="py-4">
                  <p className="text-body mb-2">Body Text (13px)</p>
                  <p className="text-body opacity-60">High-density text for primary information blocks and descriptions. Optimized for readability at small scales.</p>
                </div>
                <div className="py-4">
                  <p className="text-value mb-1">Value Display (14px)</p>
                  <p className="text-body opacity-60 italic">Data-focused scale for financial figures and metrics.</p>
                </div>
                <div className="py-4">
                  <p className="text-label mb-1">Label Text (11px)</p>
                  <p className="text-label opacity-60">Metadata, tags, and supporting UI labels.</p>
                </div>
                <div className="py-4">
                  <p className="text-overline text-primary-500">Overline Text (9px)</p>
                  <p className="text-body opacity-60 mt-2">Section headers and categorized metadata with wide letter-spacing.</p>
                </div>
              </GlassCard>

              {/* Semantic Colors */}
              <GlassCard variant="thick" className="space-y-4">
                <p className="text-overline opacity-40 mb-4">Semantic Colors</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
                    <p className="text-primary-600 dark:text-primary-400 font-bold text-[11px]">Primary Context</p>
                  </div>
                  <div className="p-3 rounded-xl bg-success-500/5 border border-success-500/10">
                    <p className="text-success-600 dark:text-success-400 font-bold text-[11px]">Success / Inflow</p>
                  </div>
                  <div className="p-3 rounded-xl bg-error-500/5 border border-error-500/10">
                    <p className="text-error-600 dark:text-error-400 font-bold text-[11px]">Error / Outflow</p>
                  </div>
                  <div className="p-3 rounded-xl bg-warning-500/5 border border-warning-500/10">
                    <p className="text-warning-600 dark:text-warning-400 font-bold text-[11px]">Warning / Alert</p>
                  </div>
                  <div className="p-3 rounded-xl bg-info-500/5 border border-info-500/10">
                    <p className="text-info-600 dark:text-info-400 font-bold text-[11px]">Information / Neutral</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary-500/5 border border-secondary-500/10">
                    <p className="text-secondary-600 dark:text-secondary-400 font-bold text-[11px]">Secondary Action</p>
                  </div>
                </div>
              </GlassCard>

              {/* Font Weights */}
              <GlassCard variant="thick" className="space-y-4">
                <p className="text-overline opacity-40 mb-4">Font Weights (Poppins)</p>
                <div className="space-y-2">
                  <p className="font-thin text-lg">Thin 100 - Financial Intelligence</p>
                  <p className="font-extralight text-lg">Extra Light 200 - Financial Intelligence</p>
                  <p className="font-light text-lg">Light 300 - Financial Intelligence</p>
                  <p className="font-normal text-lg">Normal 400 - Financial Intelligence</p>
                  <p className="font-medium text-lg">Medium 500 - Financial Intelligence</p>
                  <p className="font-semibold text-lg">Semi Bold 600 - Financial Intelligence</p>
                  <p className="font-bold text-lg">Bold 700 - Financial Intelligence</p>
                  <p className="font-extrabold text-lg">Extra Bold 800 - Financial Intelligence</p>
                  <p className="font-black text-lg">Black 900 - Financial Intelligence</p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Overlays Rendering */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
      >
        <div className="p-4 space-y-4 text-body opacity-80">
          <p>This is a standard modal using the surface-dark tokens.</p>
          <GlassInput label="Sample Input" placeholder="Type here..." />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Delete Item?"
        message="Are you sure you want to delete this? This action cannot be undone."
        type="danger"
        onConfirm={() => {
          setIsConfirmOpen(false);
          addToast('success', 'Item deleted.');
        }}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ComponentsPage;
