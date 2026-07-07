"use client"

import React, { useEffect, useState } from 'react'
import { Button } from './button'
import { usePathname } from 'next/navigation'
import { Power, User, Wallet } from 'lucide-react'
import toast from '@/lib/utils/toast';
import Modal from './modal';
import ProfileSetupModal from './profilesetupmodal';
import { useCheckIfProfileExists } from '@/hooks/Pixingo'
import { CircleLoader } from 'react-spinners';
import { useWallet } from '@/lib/genlayer/wallet';
import { getAddress } from 'viem';
import { success, error, userRejected } from "@/lib/utils/toast";


export default function Navbar() {

    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [connectionError, setConnectionError] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const {
        address: lowercaseAddress,
        isConnected,
        isMetaMaskInstalled,
        isOnCorrectNetwork,
        isLoading,
        connectWallet,
        disconnectWallet,
        switchWalletAccount,
    } = useWallet();
    const address = lowercaseAddress ? getAddress(lowercaseAddress) : null;
    const { isLoading: isCheckingProfile, data: profileExists } = useCheckIfProfileExists(address);
    console.log(profileExists)

    const handleConnect = async () => {
        if (!isMetaMaskInstalled) {
            return;
        }

        try {
            setIsConnecting(true);
            setConnectionError("");
            await connectWallet();
            setIsModalOpen(false);
        } catch (err: any) {
            console.error("Failed to connect wallet:", err);
            setConnectionError(err.message || "Failed to connect to MetaMask");

            if (err.message?.includes("rejected")) {
                userRejected("Connection cancelled");
            } else {
                error("Failed to connect wallet", {
                    description: err.message || "Check your MetaMask and try again."
                });
            }
        } finally {
            setIsConnecting(false);
        }
    };


    useEffect(() => {
        if (!address) {
            setHasChecked(false);
            setShowSetupModal(false);
            return;
        }

        // Wait for loading to finish
        if (isCheckingProfile) return;

        // Only run once per address
        if (hasChecked) return;

        setHasChecked(true);

        if (profileExists) {
            toast.success("Welcome back!", {
                description: `${address.slice(0, 6)}...${address.slice(-4)}`,
            });
        } else {
            setShowSetupModal(true);
        }
    }, [address, isCheckingProfile, profileExists, hasChecked]);

    return (
        <>
            <Modal
                isOpen={!!address && isCheckingProfile}
                onClose={() => { }}
                showCloseButton={false}
                size="sm"
            >
                <div className="flex flex-col items-center gap-4 py-4">
                    <CircleLoader size={30} color="#BC17FD" />
                    <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-white">Checking your profile</p>
                        <p className="text-xs text-muted-foreground">
                            Connecting to GenLayer...
                        </p>
                    </div>
                </div>
            </Modal>


            {isCheckingProfile == false && <ProfileSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                address={address || ""}
                onProfileCreated={() => {
                    toast.success("Profile created!", {
                        description: "Welcome to Pixingo!",
                    });
                    setShowSetupModal(false);
                }}
            />}

            <div className="w-full flex justify-end">
                {address ? (
                    <Button
                        variant="outline"

                    // className="h-10 rounded-full border-primary/20 bg-primary/5 text-[10px] font-headline font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                    >
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                        {address.slice(0, 6)}...{address.slice(-4)}
                        <Power size={12} className="ml-2 opacity-50" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleConnect}
                        variant="gradient"
                        className="w-full h-14 text-lg"
                        disabled={isConnecting}
                    >
                        <User className="w-5 h-5 mr-2" />
                        {isConnecting ? "Connecting..." : "Connect MetaMask"}
                    </Button>
                )}
            </div>

        </>
    )
}
