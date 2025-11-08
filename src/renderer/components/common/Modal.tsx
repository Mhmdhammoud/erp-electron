import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { ReactNode } from 'react';

interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  return (
    <HeroModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior="inside"
      classNames={{
        base: 'max-h-[90vh]',
        body: 'custom-scrollbar',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>{children}</ModalBody>
            {footer && <ModalFooter>{footer}</ModalFooter>}
          </>
        )}
      </ModalContent>
    </HeroModal>
  );
}
