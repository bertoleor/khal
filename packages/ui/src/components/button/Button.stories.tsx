import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { LinkButton } from './LinkButton';
import { IconButton } from './IconButton';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'glass', 'ghost', 'outline'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary', children: 'Primary' } };
export const Glass: Story = { args: { variant: 'glass', children: 'Glass' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Ghost' } };
export const Outline: Story = { args: { variant: 'outline', children: 'Outline' } };
export const Small: Story = { args: { size: 'sm', children: 'Small' } };
export const Large: Story = { args: { size: 'lg', children: 'Large' } };
export const Loading: Story = { args: { loading: true, children: 'Loading...' } };
export const WithIconLeft: Story = { args: { icon: <span>→</span>, iconPosition: 'left', children: 'With Icon' } };
export const WithIconRight: Story = { args: { icon: <span>→</span>, iconPosition: 'right', children: 'With Icon' } };

// LinkButton stories
const linkMeta: Meta<typeof LinkButton> = { title: 'Components/LinkButton', component: LinkButton, parameters: { layout: 'centered' }, tags: ['autodocs'] };
export default linkMeta;
type LinkStory = StoryObj<typeof LinkButton>;
export const LinkGlass: LinkStory = { args: { href: '/catalogo', variant: 'glass', children: 'Catálogo' } };
export const LinkPrimary: LinkStory = { args: { href: '/catalogo', variant: 'primary', children: 'Agendá tu turno' } };

// IconButton stories
const iconMeta: Meta<typeof IconButton> = { title: 'Components/IconButton', component: IconButton, parameters: { layout: 'centered' }, tags: ['autodocs'] };
export default iconMeta;
type IconStory = StoryObj<typeof IconButton>;
export const IconClose: IconStory = { args: { 'aria-label': 'Cerrar', variant: 'ghost', children: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> } };
